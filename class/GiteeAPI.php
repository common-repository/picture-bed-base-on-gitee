<?php
class PBBOG_GiteeAPI extends PBBOG_Action
{
    //初始化env文件
    public static function init()
    {
        $envdata = PBBOG_Env::pbbog_getAll();
        if (count($envdata) == 0) {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,.env缺失"]
            ]);
            die;
        }

        $username = sanitize_email($_REQUEST['email'] ?? $envdata['username']);
        if (!$username) {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,用户名必须为邮箱"]
            ]);
            die;
        }
        $password = sanitize_text_field($_REQUEST['password'] ?? $envdata['password']);
        if ($password == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,密码不能为空"]
            ]);
            die;
        }
        $client_id = sanitize_text_field($_REQUEST['client_id'] ?? $envdata['client_id']);
        if ($client_id == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,client_id不能为空"]
            ]);
            die;
        }
        $client_secret = sanitize_text_field($_REQUEST['client_secret'] ?? $envdata['client_secret']);
        if ($client_secret == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,client_secret不能为空"]
            ]);
            die;
        }
        $owner = sanitize_text_field($_REQUEST['owner'] ?? $envdata['owner']);
        if ($owner == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,owner不能为空"]
            ]);
            die;
        }
        $repo = sanitize_text_field($_REQUEST['repo'] ?? $envdata['repo']);
        if ($repo == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,repo不能为空"]
            ]);
            die;
        }
        $branche = sanitize_text_field($_REQUEST['branche'] ?? $envdata['branche']);
        if ($branche == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,branche不能为空"]
            ]);
            die;
        }

        $scopes = self::recursive_sanitize_text_field($_REQUEST['scopes']) ?? $envdata['scopes'];
        $all_scopes = ['user_info', 'projects', 'pull_requests', 'issues', 'notes', 'keys', 'hook', 'groups', 'gists', 'enterprises', 'emails'];
        if (is_array($scopes) && count($scopes) > 0) {
            for ($i = 0; $i < count($scopes); $i++) {
                if (!in_array($scopes[$i], $all_scopes)) {
                    return json_encode([
                        "header" => ["http_code" => 400], "content" => ["msg" => "错误,scope:" . $scopes[$i] . ",不符合Gitee所支持的"]
                    ]);
                    die;
                }
            }
        } else {
            if ($scopes === $envdata['scopes']) {
                $scopes = explode(" ",$scopes);
                goto next;
            } else {
                return json_encode([
                    "header" => ["http_code" => 400], "content" => ["msg" => "错误,scopes不符合Gitee所支持的"]
                ]);
                die;
            }
        }

        next:
        try {
            PBBOG_Env::pbbog_set('username', $username);
            PBBOG_Env::pbbog_set('password', $password);
            PBBOG_Env::pbbog_set('client_id', $client_id);
            PBBOG_Env::pbbog_set('client_secret', $client_secret);
            PBBOG_Env::pbbog_set('owner', $owner);
            PBBOG_Env::pbbog_set('repo', $repo);
            PBBOG_Env::pbbog_set('branche', $branche);
            PBBOG_Env::pbbog_set('scopes', implode(" ", $scopes));

            $oauth2_pwdmoded = json_decode(self::oauth2_pwdmode(), true); //主要设置oauth
            if ($oauth2_pwdmoded['header']['http_code'] == 200) {
                return json_encode([
                    "header" => ["http_code" => 200], "content" => ["msg" => "修改成功"]
                ]);
            } else {
                return json_encode([
                    "header" => ["http_code" => 400], "content" => ["msg" => "修改失败,oauth设置错误1","data"=>$oauth2_pwdmoded]
                ]);
            }
        } catch (Exception $e) {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "修改失败"]
            ]);
        }
    }

    //oauth认证-password模式
    public static function oauth2_pwdmode()
    {
        $username = PBBOG_Env::pbbog_get('username');
        $password = PBBOG_Env::pbbog_get('password');
        $client_id = PBBOG_Env::pbbog_get('client_id');
        $client_secret = PBBOG_Env::pbbog_get('client_secret');
        $scope = PBBOG_Env::pbbog_get('scopes');

        $parms = [
            "grant_type" => "password",
            "username" => $username,
            "password" => $password,
            "client_id" => $client_id,
            "client_secret" => $client_secret,
            "scope" => $scope
        ];

        $res = parent::pbbog_curl_post('https://gitee.com/oauth/token', $parms, array('Content-Type' => 'application/x-www-form-urlencoded'));
        if ($res['header']['http_code'] == 200) {
            PBBOG_Env::pbbog_set("oauth", json_encode($res['content'], 320));
            $envdata = PBBOG_Env::pbbog_getAll(['password']);
            $resdata = array_merge($envdata, $res['content']);
            $resdata['header'] = $res['header'];
        } else {
            $resdata = $res;
        }

        return json_encode($resdata, 320);
    }

    //获取oauth
    public static function getoauth()
    {
        $envdata = PBBOG_Env::pbbog_getAll(['password']);
        $envdata['oauth'] = json_decode($envdata['oauth'], true);
        return json_encode($envdata, 320);
    }

    //获取env文件内容
    public static function getenv()
    {
        $filters = self::recursive_sanitize_text_field($_REQUEST['filters']) ?? [];
        if (is_array($filters)) {
            for ($i = 0; $i < count($filters); $i++) {
                $filters[$i] = sanitize_text_field($filters[$i]);
            }
            $envdata = PBBOG_Env::pbbog_getAll($filters);
            $envdata['oauth'] = json_decode($envdata['oauth'], true);
            return json_encode($envdata, 320);
        }
    }

    //删除文件
    public static function delfile()
    {
        $access_token = sanitize_text_field($_REQUEST['access_token']);
        if ($access_token == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,access_token缺失"]
            ]);
        }
        $owner = sanitize_text_field($_REQUEST['owner'] ?? PBBOG_Env::pbbog_get('owner'));
        if ($owner == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,owner不能为空"]
            ]);
        }
        $repo = sanitize_text_field($_REQUEST['repo'] ?? PBBOG_Env::pbbog_get('repo'));
        if ($repo == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,repo不能为空"]
            ]);
        }
        $branch = sanitize_text_field($_REQUEST['branch'] ?? PBBOG_Env::pbbog_get('branche'));
        if ($branch == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,branch不能为空"]
            ]);
        }
        $path = sanitize_text_field($_REQUEST['path']);
        if ($path == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,path不能为空"]
            ]);
        }
        $sha = sanitize_text_field($_REQUEST['sha']);
        if ($sha == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,sha不能为空"]
            ]);
        }
        $message = sanitize_text_field($_REQUEST['message']);
        if ($message == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,message不能为空"]
            ]);
        }

        $parms = [
            "access_token" => $access_token,
            "owner" => $owner,
            "repo" => $repo,
            "branch" => $branch,
            "path" => $path,
            "sha" => $sha,
            "message" => $message,
        ];

        $res = parent::pbbog_curl_delete("https://gitee.com/api/v5/repos/{$parms['owner']}/{$parms['repo']}/contents/{$parms['path']}?" . http_build_query([
            "access_token" => $parms['access_token'],
            "sha" => $parms['sha'],
            "message" => $parms['message'],
            "branch" => $parms['branch']
        ]), [], ['Content-Type' => 'application/json;charset=UTF-8']);
        return json_encode($res, 320);
    }

    //获取文件内容
    public static function getfile()
    {
        $access_token = sanitize_text_field($_REQUEST['access_token']);
        if ($access_token == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,access_token缺失"]
            ]);
            die;
        }
        $owner = sanitize_text_field($_REQUEST['owner'] ?? PBBOG_Env::pbbog_get('owner'));
        if ($owner == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,owner不能为空"]
            ]);
            die;
        }
        $repo = sanitize_text_field($_REQUEST['repo'] ?? PBBOG_Env::pbbog_get('repo'));
        if ($repo == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,repo不能为空"]
            ]);
            die;
        }
        $sha = sanitize_text_field($_REQUEST['sha']);
        if ($sha == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,sha不能为空"]
            ]);
            die;
        }

        $parms = [
            "access_token" => $access_token,
            "owner" => $owner,
            "repo" => $repo,
            "sha" => $sha
        ];
        $res = parent::pbbog_curl_get("https://gitee.com/api/v5/repos/{$parms['owner']}/{$parms['repo']}/git/blobs/{$parms['sha']}?access_token={$parms['access_token']}");
        return json_encode($res, 320);
    }

    //获取目录Tree
    public static function trees()
    {
        $access_token = sanitize_text_field($_REQUEST['access_token']) ?? json_decode(PBBOG_Env::pbbog_get('oauth'), true)["access_token"];
        if ($access_token == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,access_token缺失"]
            ]);
            die;
        }
        $owner = sanitize_text_field($_REQUEST['owner'] ?? PBBOG_Env::pbbog_get('owner'));
        if ($owner == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,owner不能为空"]
            ]);
            die;
        }
        $repo = sanitize_text_field($_REQUEST['repo'] ?? PBBOG_Env::pbbog_get('repo'));
        if ($repo == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,repo不能为空"]
            ]);
            die;
        }
        $sha = sanitize_text_field($_REQUEST['sha']);
        if ($sha == '') {
            return json_encode([
                "header" => ["http_code" => 400], "content" => ["msg" => "错误,sha不能为空"]
            ]);
            die;
        }

        $parms = [
            "access_token" => $access_token,
            "owner" => $owner,
            "repo" => $repo,
            "sha" => $sha
        ];

        $res = parent::pbbog_curl_get("https://gitee.com/api/v5/repos/{$parms['owner']}/{$parms['repo']}/git/trees/{$parms['sha']}?access_token={$parms['access_token']}", array('Content-Type' => 'application/x-www-form-urlencoded;charset=utf-8'));

        if ($res['header']['http_code'] == 401) { //身份认证失败
            return json_encode($res, 320);
        }

        foreach ($res['content']['tree'] as &$v) {
            $v['icon'] = $v['mode'] == "40000" ? "📂" : "📄";
        }
        usort($res['content']['tree'], function ($a, $b) {
            if ($a['mode'] > $b['mode']) {
                return 1;
            } else {
                return 0;
            }
        });

        return json_encode($res, 320);
    }

    //请求建立Pages-服务->gitee pages[Gitee付费用户],此接口暂不开放
    public static function pages_builds()
    {
        $parms = [
            "access_token" => sanitize_text_field($_REQUEST['access_token']),
            "owner" => sanitize_text_field($_REQUEST['owner']) ?? PBBOG_Env::pbbog_get('owner'),
            "repo" => sanitize_text_field($_REQUEST['repo']) ?? PBBOG_Env::pbbog_get('repo')
        ];
        $res = parent::pbbog_curl_post("https://gitee.com/api/v5/repos/{$parms['owner']}/{$parms['repo']}/pages/builds", $parms, array('Content-Type' => 'application/x-www-form-urlencoded;charset=utf-8'));
        return json_encode($res, 320);
    }

    /**
     * Recursive sanitation for an array
     * 
     * @param $array
     *
     * @return mixed
     */
    public static function recursive_sanitize_text_field($array) {
        foreach ( $array as $key => &$value ) {
            if ( is_array( $value ) ) {
                $value = self::recursive_sanitize_text_field( $value );
            } else {
                $value = sanitize_text_field( $value );
            }
        }
        return $array;
    }
}
