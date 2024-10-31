<?php
/*
Plugin Name: picture bed base on gitee
Plugin URI: 
Description: picture bed base on gitee,基于Gitee的图床,可以将图片,文件上传到Gitee仓库
Version: 1.0.0
Author: RorinL
Author URI: http://www.rfbynet.club
License: GPLv2
*/

/* Copyright YEAR PLUGIN_AUTHOR_NAME (email : rorinliang076@gmail.comn)
 
This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.
 
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 
You should have received a copy of the GNU General Public License along with this program; if not, write to the Free Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 
*/
/**加载项目 */
include_once plugin_dir_path(__FILE__) . "class//Env.php"; //Env
include_once plugin_dir_path(__FILE__) . "class//Action.php"; //Action
include_once plugin_dir_path(__FILE__) . "class//GiteeAPI.php"; //GiteeAPI

include_once plugin_dir_path(__FILE__) . 'api.php'; //路由
include_once plugin_dir_path(__FILE__) . 'functions.php'; //函数体

register_activation_hook(__FILE__, 'pbbog_plugin_activate');
register_deactivation_hook( __FILE__, 'pbbog_plugin_deactivation' );