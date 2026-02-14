# ##############################################################################
# Workspace Validation
# ##############################################################################
resource "terraform_data" "workspace_validation" {
  lifecycle {
    precondition {
      condition     = terraform.workspace != "default"
      error_message = "Workspace must not be default"
    }
  }
}

# ##############################################################################
# Backend
# ##############################################################################
terraform {
  required_version = ">=1.11.5"

  backend "s3" {
    key                  = "openfactcheck-playground/terraform.tfstate"
    workspace_key_prefix = "openfactcheck-playground"
  }

  required_providers {
    aws = {
      version = ">=6.32.0"
      source  = "hashicorp/aws"
    }
  }
}

# ##############################################################################
# Provider Configuration
# ##############################################################################
provider "aws" {
  region              = var.aws_region
  profile             = var.aws_profile
  allowed_account_ids = [var.aws_account]

  default_tags {
    # Default tags applied to all resources. Individual resources should override:
    # - Name: Resource-specific identifier
    # - Function: Purpose or role of the resource
    # - Any other tags specific to the resource's context
    tags = {
      # General
      Module  = "OpenFactCheck Playground"
      Owner   = "OpenFactCheck Research"
      Creator = "openfactcheck@gmail.com"

      # Environment & Lifecycle
      Environment = terraform.workspace
      Criticality = terraform.workspace == "production" ? "High" : "Low"

      # Technical Management
      ManagedBy     = "terraform"
      TerraformPath = "deployments/base"
      Region        = var.aws_region
    }
  }
}

# ##############################################################################
# Data Sources
# ##############################################################################
data "aws_caller_identity" "self" {}

data "aws_region" "current" {}