<?php
class PBBOG_Action
{
  public static function pbbog_curl_get($url, $header = ['Content-Type' => 'application/json;charset=UTF-8'])
  {
    $args = array(
      'headers' => $header
    );
    $response = wp_remote_get($url, $args);
    $http_code = wp_remote_retrieve_response_code($response);
    $response['headers'] = @(array)$response['headers'];
    $response['headers']['http_code'] = $http_code;
    return ["header" => $response['headers'], "content" => json_decode($response['body'], true)];
  }
  public static function pbbog_curl_post($url, $array, $header = ['Content-Type' => 'application/json;charset=UTF-8'])
  {
    $args = array(
      'body'        => $array,
      'sslverify'   => false,
      'headers'     => $header
    );
    $response = wp_remote_post($url, $args);
    $http_code = wp_remote_retrieve_response_code($response);
    $response['headers'] = @(array)$response['headers'];
    $response['headers']['http_code'] = $http_code;
    return ["header" => $response['headers'], "content" => json_decode($response['body'], true)];
  }
  public static function pbbog_curl_put($url, $array, $header = ['Content-Type' => 'application/json;charset=UTF-8'])
  {
    $args     = array(
      'method' => 'PUT',
      'body' => $array,
      'sslverify'   => false,
      'headers'     => $header
    );
    $response = wp_remote_request($url, $args);
    $http_code = wp_remote_retrieve_response_code($response);
    $response['headers'] = @(array)$response['headers'];
    $response['headers']['http_code'] = $http_code;
    return ["header" => $response['headers'], "content" => json_decode($response['body'], true)];
  }
  public static function pbbog_curl_delete($url, $array = [], $header = [])
  {
    $args     = array(
      'method' => 'DELETE',
      'body' => $array,
      'sslverify'   => false,
      'headers'     => $header
    );
    $response = wp_remote_request($url, $args);
    $http_code = wp_remote_retrieve_response_code($response);
    $response['headers'] = @(array)$response['headers'];
    $response['headers']['http_code'] = $http_code;
    return ["header" => $response['headers'], "content" => json_decode($response['body'], true)];
  }
}
