variable "aws_profile" {
  description = "AWS profile for deployment"
  type        = string
}

variable "aws_region" {
  description = "AWS Region for deployment"
  type        = string
}

variable "aws_account" {
  description = "AWS Account ID for deployment"
  type        = string

  validation {
    condition     = length(var.aws_account) == 12 && can(regex("^[0-9]+$", var.aws_account))
    error_message = "AWS Account ID must be a 12-digit number."
  }
}

variable "aws_account_name" {
  description = "AWS Account Name for deployment (optional, for reference)"
  type        = string
}

# ##############################################################################
# Integration Environment
# ##############################################################################
variable "integration_vite_api_url" {
  description = "API URL for integration"
  type        = string
}

variable "integration_vite_cognito_user_pool_id" {
  description = "Cognito User Pool ID for integration"
  type        = string
  sensitive   = true
}

variable "integration_vite_cognito_client_id" {
  description = "Cognito Client ID for integration"
  type        = string
  sensitive   = true
}

# ##############################################################################
# Production Environment
# ##############################################################################
variable "production_vite_api_url" {
  description = "API URL for production"
  type        = string
}

variable "production_vite_cognito_user_pool_id" {
  description = "Cognito User Pool ID for production"
  type        = string
  sensitive   = true
}

variable "production_vite_cognito_client_id" {
  description = "Cognito Client ID for production"
  type        = string
  sensitive   = true
}

