# ##############################################################################
# Outputs
# ##############################################################################

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.ofc_playground.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.ofc_playground_client.id
}

output "website_bucket_name" {
  description = "S3 bucket name for website hosting"
  value       = aws_s3_bucket.ofc_playground_website.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.ofc_playground.id
}

output "website_url" {
  description = "Website URL"
  value       = "https://${local.playground_domain}"
}