# ##############################################################################
# Outputs
# ##############################################################################

output "website_bucket_name" {
  description = "S3 bucket name for website hosting"
  value       = aws_s3_bucket.openfactcheck_playground_website.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.openfactcheck_playground.id
}

output "website_url" {
  description = "Website URL"
  value       = "https://${local.playground_domain}"
}