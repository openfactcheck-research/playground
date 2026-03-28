# ##############################################################################
# Route53 DNS Record for CloudFront
# ##############################################################################

resource "aws_route53_record" "openfactcheck_playground" {
  zone_id = local.route53_zone_id
  name    = local.playground_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.openfactcheck_playground.domain_name
    zone_id                = aws_cloudfront_distribution.openfactcheck_playground.hosted_zone_id
    evaluate_target_health = false
  }
}

# IPv6 record
resource "aws_route53_record" "openfactcheck_playground_ipv6" {
  zone_id = local.route53_zone_id
  name    = local.playground_domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.openfactcheck_playground.domain_name
    zone_id                = aws_cloudfront_distribution.openfactcheck_playground.hosted_zone_id
    evaluate_target_health = false
  }
}
