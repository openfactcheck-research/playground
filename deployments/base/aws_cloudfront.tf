# ##############################################################################
# CloudFront Distribution for SPA Hosting
# ##############################################################################

resource "aws_cloudfront_distribution" "ofc_playground" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US, Canada, Europe (cheapest)
  comment             = "OpenFactCheck Playground - ${terraform.workspace}"

  # Custom domain
  aliases = [local.playground_domain]

  # S3 Origin with Origin Access Control
  origin {
    domain_name              = aws_s3_bucket.ofc_playground_website.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.ofc_playground_website.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.ofc_playground.id
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.ofc_playground_website.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # Use managed cache policy for static content
    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # SPA routing - return index.html for 403/404 errors
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  # No geographic restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # ACM Certificate for custom domain
  viewer_certificate {
    acm_certificate_arn      = local.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "OpenFactCheck Playground CDN - ${terraform.workspace}"
  }
}

# ##############################################################################
# Origin Access Control - allows CloudFront to access private S3
# ##############################################################################

resource "aws_cloudfront_origin_access_control" "ofc_playground" {
  name                              = "ofc-playground-oac-${terraform.workspace}"
  description                       = "OAC for OpenFactCheck Playground S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ##############################################################################
# Data Sources
# ##############################################################################

# AWS managed cache policy for static content
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}
