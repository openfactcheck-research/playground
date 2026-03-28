# ##############################################################################
# Integration — SSM Parameters
# ##############################################################################
resource "aws_ssm_parameter" "integration_vite_cognito_user_pool_id" {
  name  = "/playground/integration/VITE_COGNITO_USER_POOL_ID"
  type  = "SecureString"
  value = var.integration_vite_cognito_user_pool_id
}

resource "aws_ssm_parameter" "integration_vite_cognito_client_id" {
  name  = "/playground/integration/VITE_COGNITO_CLIENT_ID"
  type  = "SecureString"
  value = var.integration_vite_cognito_client_id
}

# ##############################################################################
# Production — SSM Parameters
# ##############################################################################
resource "aws_ssm_parameter" "production_vite_cognito_user_pool_id" {
  name  = "/playground/production/VITE_COGNITO_USER_POOL_ID"
  type  = "SecureString"
  value = var.production_vite_cognito_user_pool_id
}

resource "aws_ssm_parameter" "production_vite_cognito_client_id" {
  name  = "/playground/production/VITE_COGNITO_CLIENT_ID"
  type  = "SecureString"
  value = var.production_vite_cognito_client_id
}

