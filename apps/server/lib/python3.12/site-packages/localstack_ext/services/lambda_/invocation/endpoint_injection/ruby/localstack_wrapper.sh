#!/bin/sh

# We're patching the ruby AWS SDK here directly to make it use the AWS_ENDPOINT_URL environment variable,
# which avoids the DNS-based transparent endpoint injection.

sed -i 's/options.merge/options.merge(endpoint: ENV["AWS_ENDPOINT_URL"]).merge/g' /var/runtime/gems/aws-sdk-core-*/lib/seahorse/client/base.rb

exec "$@"
