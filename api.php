<?php
function pbbog_api()
{

    $type = sanitize_text_field($_REQUEST['type']);

    if ($type !== "init" && $type !== "getenv") {
        $envdata = json_decode(PBBOG_Env::pbbog_get('oauth'), true);
        if ($envdata) {
            if (time() >= $envdata['created_at'] + $envdata['expires_in']) { //当前时间已经是created_at+expires_in的之后
                $refresh_token = PBBOG_Action::pbbog_curl_post("https://gitee.com/oauth/token", ["grant_type" => "refresh_token", "refresh_token" => $envdata['refresh_token']]);
                $_REQUEST['access_token'] = sanitize_text_field($_REQUEST['access_token']);
                if ($refresh_token['header']['http_code'] == 200) {
                    $retoken_type = json_encode($refresh_token['content']);
                    $_REQUEST['access_token'] = $refresh_token['content']['access_token'];
                    PBBOG_Env::pbbog_set("oauth", $retoken_type);
                } else {
                    PBBOG_GiteeAPI::init();
                    $env_oauth = json_decode(PBBOG_Env::pbbog_get('oauth'), true);
                    $_REQUEST['access_token'] = $env_oauth['access_token'];
                }
            }
        }
    }

    if ($type === "oauth2_pwdmode") {
        echo PBBOG_GiteeAPI::oauth2_pwdmode();
    } elseif ($type === "delfile") {
        echo PBBOG_GiteeAPI::delfile();
    } elseif ($type === "trees") {
        echo PBBOG_GiteeAPI::trees();
    } elseif ($type === "pages_builds") {
        echo PBBOG_GiteeAPI::pages_builds();
    } elseif ($type === "init") {
        echo PBBOG_GiteeAPI::init();
    } elseif ($type === "getoauth") {
        echo PBBOG_GiteeAPI::getoauth();
    } elseif ($type === "getenv") {
        echo PBBOG_GiteeAPI::getenv();
    } elseif ($type === "getfile") {
        echo PBBOG_GiteeAPI::getfile();
    }
    // elseif($type==="extget"){
    //     include 'ext.php';
    //     $ext = strtolower($_REQUEST["ext"]);
    //     $findmime = isset($extars[$ext])?$extars[$ext]:'';
    //     echo $findmime;
    // }
    die();
}

add_action('wp_ajax_nopriv_pbbogapi', 'pbbog_api');
add_action('wp_ajax_pbbogapi', 'pbbog_api');
