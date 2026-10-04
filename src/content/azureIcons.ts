/**
 * Official Microsoft Azure / Entra architecture icons (public/azure-icons).
 * Terms: https://learn.microsoft.com/azure/architecture/icons/ — permitted in architecture
 * diagrams, training materials and documentation. Each icon may only represent the product
 * it was designed for, must be shown with that product's name nearby, and must not be
 * cropped, flipped, rotated, recolored or distorted. Never use them to represent this site.
 * Content references these as icon: "azure:<key>".
 */
export const AZURE_ICONS = {
  'entra-id': "Microsoft Entra ID",
  'policy': "Azure Policy",
  'management-groups': "Management groups",
  'subscriptions': "Subscriptions",
  'resource-groups': "Resource groups",
  'cost-management': "Cost Management",
  'advisor': "Azure Advisor",
  'key-vault': "Key Vault",
  'users': "Users",
  'groups': "Groups",
  'managed-identities': "Managed identities",
  'storage-accounts': "Storage accounts",
  'file-shares': "Azure file shares",
  'storage-sync': "Storage Sync Services",
  'virtual-machine': "Virtual machines",
  'vm-scale-sets': "Virtual machine scale sets",
  'disks': "Disks",
  'compute-galleries': "Azure compute galleries",
  'templates': "Templates",
  'app-services': "App Services",
  'app-service-plans': "App Service plans",
  'container-registries': "Container registries",
  'container-instances': "Container instances",
  'kubernetes-services': "Kubernetes services",
  'container-apps-environments': "Container Apps environments",
  'virtual-networks': "Virtual networks",
  'subnet': "Subnet",
  'network-interfaces': "Network interfaces",
  'network-security-groups': "Network security groups",
  'application-security-groups': "Application security groups",
  'public-ip-addresses': "Public IP addresses",
  'route-tables': "Route tables",
  'firewalls': "Azure Firewall",
  'waf-policies': "Web Application Firewall policies",
  'load-balancers': "Load balancers",
  'application-gateways': "Application gateways",
  'front-door': "Front Door and CDN profiles",
  'traffic-manager': "Traffic Manager profiles",
  'dns-zones': "DNS zones",
  'dns-private-resolver': "DNS Private Resolver",
  'virtual-network-gateways': "Virtual network gateways",
  'local-network-gateways': "Local network gateways",
  'connections': "Connections",
  'expressroute-circuits': "ExpressRoute circuits",
  'bastions': "Bastions",
  'nat': "NAT gateways",
  'private-link': "Private Link",
  'network-watcher': "Network Watcher",
  'monitor': "Azure Monitor",
  'activity-log': "Activity log",
  'diagnostics-settings': "Diagnostic settings",
  'log-analytics': "Log Analytics workspaces",
  'application-insights': "Application Insights",
  'alerts': "Alerts",
  'backup-center': "Azure Backup center",
  'backup-vault': "Backup vaults",
  'recovery-services-vaults': "Recovery Services vaults",
  'resource-mover': "Azure Resource Mover",
} as const

export type AzureIconKey = keyof typeof AZURE_ICONS

export const isAzureIcon = (name: string | undefined): name is `azure:${AzureIconKey}` =>
  !!name && name.startsWith('azure:') && name.slice(6) in AZURE_ICONS

/** URL of an official icon, honoring the Vite base path. */
export const azureIconUrl = (name: `azure:${AzureIconKey}` | string) => `${import.meta.env.BASE_URL}azure-icons/${name.replace(/^azure:/, '')}.svg`
