// Infraestructura Azure para RAVE — App Service (contenedores Linux) + Azure SQL + Blob
// Storage + Key Vault + Application Insights. Pensado para desplegarse una vez de forma
// manual (bootstrap) y luego recibir actualizaciones de imagen via .github/workflows/deploy.yml.
// Ver docs/07-despliegue-azure.md para el procedimiento completo.

@minLength(3)
@maxLength(15)
@description('Prefijo corto usado para nombrar los recursos (ej. "rave-prod", "rave-dev").')
param environmentName string = 'rave-prod'

@description('Region de Azure donde se crean los recursos.')
param location string = resourceGroup().location

@description('Login del administrador de Azure SQL.')
param sqlAdminLogin string = 'raveadmin'

@secure()
@description('Password del administrador de Azure SQL. Debe cumplir la politica de complejidad de SQL Server.')
param sqlAdminPassword string

@secure()
@description('Secreto usado para firmar los access tokens JWT.')
param jwtAccessSecret string

@secure()
@description('Secreto usado para firmar los refresh tokens JWT.')
param jwtRefreshSecret string

@description('Tag de imagen Docker a desplegar inicialmente (el pipeline de CD la actualiza despues).')
param containerImageTag string = 'latest'

@description('SKU del App Service Plan (Linux). B1 para demo/dev, P0v3+ recomendado para produccion.')
param appServicePlanSku string = 'B1'

@description('SKU de la base de datos Azure SQL. "Basic" (5 DTU, 2GB) alcanza sobrado para cargas chicas (<10 usuarios).')
param sqlDatabaseSku string = 'Basic'

@description('Origen permitido por CORS en el backend (URL publica del frontend).')
param corsOrigin string = 'https://${environmentName}-web.azurewebsites.net'

// Storage Account, ACR y Key Vault requieren nombres globalmente unicos en todo Azure
// (no solo dentro de la suscripcion), de ahi el sufijo derivado de uniqueString().
var uniqueSuffix = uniqueString(resourceGroup().id)
var acrName = toLower('${replace(environmentName, '-', '')}acr${uniqueSuffix}')
var sqlServerName = '${environmentName}-sql'
var sqlDatabaseName = 'RaveDb'
var storageAccountName = take(toLower(replace('${environmentName}st${uniqueSuffix}', '-', '')), 24)
var keyVaultName = take('${environmentName}-kv-${uniqueSuffix}', 24)
var appServicePlanName = '${environmentName}-plan'
var backendAppName = '${environmentName}-api'
var frontendAppName = '${environmentName}-web'
var logAnalyticsName = '${environmentName}-logs'
var appInsightsName = '${environmentName}-insights'

var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

// ---------- Observabilidad ----------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ---------- Registro de contenedores ----------

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
  }
}

// ---------- Base de datos ----------

resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: { name: sqlDatabaseSku, tier: sqlDatabaseSku == 'Basic' ? 'Basic' : 'Standard' }
  properties: {
    zoneRedundant: false
  }
}

// Permite que servicios de Azure (App Service) alcancen el servidor SQL.
resource sqlFirewallAllowAzure 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ---------- Almacenamiento de PDFs ----------

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource boletosContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'boletos-pdf'
  properties: {
    publicAccess: 'None'
  }
}

// ---------- Secretos ----------

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
  }
}

resource secretSqlConnectionString 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'database-url'
  properties: {
    value: 'sqlserver://${sqlServer.properties.fullyQualifiedDomainName}:1433;database=${sqlDatabaseName};user=${sqlAdminLogin};password=${sqlAdminPassword};encrypt=true;trustServerCertificate=false'
  }
}

resource secretJwtAccess 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'jwt-access-secret'
  properties: { value: jwtAccessSecret }
}

resource secretJwtRefresh 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'jwt-refresh-secret'
  properties: { value: jwtRefreshSecret }
}

resource secretStorageConnectionString 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'storage-connection-string'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
  }
}

// ---------- Plan de App Service (Linux, contenedores) ----------

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: { name: appServicePlanSku }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// ---------- Backend (NestJS) ----------

resource backendApp 'Microsoft.Web/sites@2023-12-01' = {
  name: backendAppName
  location: location
  kind: 'app,linux,container'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${acr.properties.loginServer}/rave-backend:${containerImageTag}'
      acrUseManagedIdentityCreds: true
      alwaysOn: true
      // App Service sondea esta ruta (200 = sano). El endpoint GET /health responde sin
      // auth ni acceso a BD, por lo que no da falsos negativos durante el arranque.
      healthCheckPath: '/health'
      appSettings: [
        { name: 'WEBSITES_PORT', value: '3001' }
        { name: 'PORT', value: '3001' }
        { name: 'NODE_ENV', value: 'production' }
        { name: 'CORS_ORIGIN', value: corsOrigin }
        { name: 'JWT_ACCESS_EXPIRES_IN', value: '15m' }
        { name: 'JWT_REFRESH_EXPIRES_IN', value: '7d' }
        { name: 'AZURE_STORAGE_CONTAINER', value: 'boletos-pdf' }
        { name: 'THROTTLE_TTL', value: '60' }
        { name: 'THROTTLE_LIMIT', value: '100' }
        { name: 'DATABASE_URL', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${secretSqlConnectionString.name})' }
        { name: 'JWT_ACCESS_SECRET', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${secretJwtAccess.name})' }
        { name: 'JWT_REFRESH_SECRET', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${secretJwtRefresh.name})' }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${secretStorageConnectionString.name})' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
      ]
    }
  }
}

// ---------- Frontend (Next.js) ----------

resource frontendApp 'Microsoft.Web/sites@2023-12-01' = {
  name: frontendAppName
  location: location
  kind: 'app,linux,container'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${acr.properties.loginServer}/rave-frontend:${containerImageTag}'
      acrUseManagedIdentityCreds: true
      alwaysOn: true
      appSettings: [
        { name: 'WEBSITES_PORT', value: '3000' }
        { name: 'PORT', value: '3000' }
        { name: 'NODE_ENV', value: 'production' }
        { name: 'BACKEND_URL', value: 'https://${backendApp.properties.defaultHostName}' }
        { name: 'ACCESS_TOKEN_MAX_AGE_SECONDS', value: '900' }
        { name: 'REFRESH_TOKEN_MAX_AGE_SECONDS', value: '604800' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
      ]
    }
  }
}

// ---------- Permisos (identidades administradas) ----------

resource backendAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, backendApp.id, 'AcrPull')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: backendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource frontendAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, frontendApp.id, 'AcrPull')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: frontendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource backendKeyVaultAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, backendApp.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalId: backendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource frontendKeyVaultAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, frontendApp.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalId: frontendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ---------- Diagnostico -> Log Analytics ----------

resource backendDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'backend-logs'
  scope: backendApp
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      { category: 'AppServiceHTTPLogs', enabled: true }
      { category: 'AppServiceConsoleLogs', enabled: true }
      { category: 'AppServiceAppLogs', enabled: true }
    ]
  }
}

output backendUrl string = 'https://${backendApp.properties.defaultHostName}'
output frontendUrl string = 'https://${frontendApp.properties.defaultHostName}'
output acrLoginServer string = acr.properties.loginServer
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
