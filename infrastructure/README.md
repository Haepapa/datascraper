## Permissions

### Service Principal permissions on Shared Storage Account
- Storage Account Contributor
- Storage Blob Data Contributor
- Reader

## Setup

This code assumes:
- a shared storage account is setup where the state file can be stored
- a service principal is setup with appropriate permissions on the target subscription

Create `.tfvars` file with the following content

`subscription_id = ""`\
`client_id = ""`\
`client_secret = ""`\
`tenant_id = ""`

Craete `backend.tf` file with the following content

`terraform {`\
`backend "azurerm" {`\
`resource_group_name     = ""`\
`storage_account_name    = ""`\
`container_name          = ""`\
`key                     = ""`\
`subscription_id         = ""`\
`client_id               = ""`\
`client_secret           = ""`\
`tenant_id               = ""`\
`}`\
`}`