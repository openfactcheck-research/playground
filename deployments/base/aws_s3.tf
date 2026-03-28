# ##############################################################################
# S3 Bucket for Static Website Hosting (via CloudFront)
# ##############################################################################

resource "aws_s3_bucket" "openfactcheck_playground_website" {
  bucket = "openfactcheck-playground-${terraform.workspace}-${var.aws_region}"

  tags = {
    Name = "OpenFactCheck Playground Website - ${terraform.workspace}"
  }
}

# ##############################################################################
# Bucket Configuration - Private (CloudFront serves content)
# ##############################################################################

# Block all public access - CloudFront will access via OAC
resource "aws_s3_bucket_public_access_block" "openfactcheck_playground_website" {
  bucket = aws_s3_bucket.openfactcheck_playground_website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Allow only CloudFront to access the bucket
resource "aws_s3_bucket_policy" "openfactcheck_playground_website" {
  bucket = aws_s3_bucket.openfactcheck_playground_website.id

  depends_on = [aws_s3_bucket_public_access_block.openfactcheck_playground_website]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.openfactcheck_playground_website.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.openfactcheck_playground.arn
          }
        }
      }
    ]
  })
}

# ##############################################################################
# CORS Configuration (for API calls from the frontend)
# ##############################################################################

resource "aws_s3_bucket_cors_configuration" "openfactcheck_playground_website" {
  bucket = aws_s3_bucket.openfactcheck_playground_website.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}
