#!/bin/bash

send_request() {
    local url="$1"
    local method="$2"
    local data="$3"
    local response
    local status_code

    if [ -n "$data" ]; then
        response=$(printf '%s' "$data" | curl -s -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d @- "$url" -o response_body.txt)
    else
        response=$(curl -s -w "%{http_code}" -X "$method" "$url" -o response_body.txt)
    fi

    status_code="${response: -3}"
    response_body=$(<response_body.txt)

    if [ "$status_code" -ne 201 ]; then
        echo "response status: $status_code"
        echo "response body: $response_body"
    fi

    rm response_body.txt
}

check_health() {
    local url="http://localhost:3000/api/healthz"
    local status_code

    status_code=$(curl -o /dev/null -s -w "%{http_code}" "$url")
    if [ "$status_code" -ne 200 ]; then
        echo "Health check failed"
        exit 1
    fi
}

send_command() {
    local command="$1"
    local command_id="$2"
    local url="http://localhost:3000/api/commands/$command_id"
    local payload

    payload=$(printf '{"command":"%s"}' "$command")
    send_request "$url" "POST" "$payload"
}

send_error() {
    local cmd_err="$1"
    local command_id="$2"
    local error_id
    local url
    local payload

    error_id=$(uuidgen)
    url="http://localhost:3000/api/commands/$command_id/$error_id"
    payload=$(printf '{"cmd_err":"%s"}' "$cmd_err")
    send_request "$url" "POST" "$payload"
}

if [ $# -lt 1 ]; then
    echo "Please provide a command"
    exit 1
fi

check_health

command="$*"
command_id=$(uuidgen)

send_command "$command" "$command_id"

eval "$command" 2> >(while read -r cmd_err; do
  echo "$cmd_err"
  send_error "$cmd_err" "$command_id"
done)
