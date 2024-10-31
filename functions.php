<?php

/**
 * action,filter等所有函数
 */
//创建子菜单
function pbbog_create_menu()
{
    pbbog_bootstrap4frame();
    add_options_page(
        'Gitee图床',
        'Gitee图床',
        'manage_options',
        __FILE__,
        'pbbog_options_page_html'
    );
}
function pbbog_options_page_html()
{
    wp_enqueue_script('pbbog-optionsjs-scripts', plugin_dir_url(__FILE__) . 'assets/js/options.js', array(), '0.0.32');
    $files = file_get_contents(dirname(__FILE__) . '/view/options.html');
    echo $files;
}

//编辑器中触发页面
//Register Meta Box
function pbbog_register_meta_box()
{
    wp_enqueue_script('pbbog-popperjs-scripts', plugin_dir_url(__FILE__) . 'assets/js/popper.min.js', array(), '4.6.0');
    pbbog_bootstrap4frame();
    wp_enqueue_style('pbbog-metabox-style', plugin_dir_url(__FILE__) . 'assets/css/metabox.css', array(), '0.0.23', 'screen');
    wp_enqueue_script('pbbog-jquerybase64-scripts', plugin_dir_url(__FILE__) . 'assets/js/jquery.base64.js', array(), '0.0.4');
    wp_enqueue_script('pbbog-metaboxjs-scripts', plugin_dir_url(__FILE__) . 'assets/js/metabox.js', array(), '0.0.116');

    add_meta_box('pbbog-meta-box-id', esc_html__('Gitee图床', 'Gitee Drawing Bed'), 'pbbog_meta_box_callback', 'post', 'normal', 'high');
}
//Add field
function pbbog_meta_box_callback()
{
    $files = file_get_contents(dirname(__FILE__) . '/view/meta-box.html');
    echo $files;
}

//bootstrap4
function pbbog_bootstrap4frame()
{
    wp_enqueue_style('pbbog-boostrap4-style', plugin_dir_url(__FILE__) . 'assets/css/bootstrap.css', array(), '4.6.1', 'screen');
    wp_enqueue_style('pbbog-bicon150-style', plugin_dir_url(__FILE__) . 'assets/bi150/bootstrap-icons.css', array(), '4.6.0', 'screen');
    wp_enqueue_script('pbbog-bootstrap4js-scripts', plugin_dir_url(__FILE__) . 'assets/js/bootstrap.js', array(), '4.6.1');
}

//跳转到设置页面[pbbog_options_page_html]
function pbbog_load_plugin()
{
    if (is_admin() && get_option('pbbog_Activated_Plugin') == 'pbbog-Plugin-Slug') {
        delete_option('pbbog_Activated_Plugin');
        wp_redirect(admin_url('options-general.php?page=picture-bed-base-on-gitee%2Ffunctions.php'));
        exit;
    }
}

//每小时检测一次accessToken是否应该重新获取
function pbbog_reToken_hourly()
{
    $envdata = json_decode(PBBOG_Env::pbbog_get('oauth'), true);
    if ($envdata) {
        if (time() >= $envdata['created_at'] + $envdata['expires_in']) { //当前时间已经是created_at+expires_in的之后
            $refresh_token = PBBOG_Action::pbbog_curl_post("https://gitee.com/oauth/token", ["grant_type" => "refresh_token", "refresh_token" => $envdata['refresh_token']]);
            if ($refresh_token['header']['http_code'] == 200) {
                $retoken_type = json_encode($refresh_token['content']);
                PBBOG_Env::pbbog_set("oauth", $retoken_type);
            } else {
                PBBOG_GiteeAPI::init();
            }
        }
    }
}


//插件启用时
function pbbog_plugin_activate()
{
    add_option('pbbog_Activated_Plugin', 'pbbog-Plugin-Slug'); //跳转到设置页面[pbbog_options_page_html]
    wp_schedule_event(time(), 'hourly', 'pbbog_hourly_reToken'); //每小时检测一次accessToken是否应该重新获取
}
//插件禁用时
function pbbog_plugin_deactivation()
{
    @wp_clear_scheduled_hook('pbbog_hourly_reToken');
}

add_action('admin_menu', 'pbbog_create_menu');
add_action('add_meta_boxes', 'pbbog_register_meta_box');
add_action('admin_init', 'pbbog_load_plugin');
add_action('pbbog_hourly_reToken', 'pbbog_reToken_hourly');
