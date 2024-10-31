<?php
class PBBOG_Env
{
    /**
     * 获取环境变量值
     * @access public
     * @param string $name 环境变量名（支持二级 . 号分割）
     * @param string $default 默认值
     * @return mixed
     */
    public static function pbbog_get(string $name, $default = null)
    {
        $file = dirname(dirname(__FILE__)) . "/.env";
        $fp = fopen($file, 'r');
        $rc = '';
        if ($fp) {
            while (!feof($fp)) {
                $lcon = str_replace("\n", "", fgets($fp));
                if (strpos($lcon, $name) !== false) {
                    $rc = explode("=", $lcon)[1];
                    break;
                }
            }
            fclose($fp);
        }
        return $rc;
    }

    /**
     * 获取所有环境变量值
     * @access public
     * @param array $filter 环境变量名，过滤数组[排除]
     * @return mixed
     */
    public static function pbbog_getAll($filter = [])
    {
        $file = dirname(dirname(__FILE__)) . "/.env";
        $fp = @fopen($file, 'r');
        $arrs = [];
        if ($fp) {
            while (!feof($fp)) {
                $lcon = str_replace("\n", "", fgets($fp));
                $rc = explode("=", $lcon);
                if (!in_array($rc[0], $filter)) {
                    $arrs[$rc[0]] = $rc[1];
                }
            }
            fclose($fp);
        }
        return $arrs;
    }

    /**
     * 设置环境变量值
     * @access public
     * @param string $name 环境变量名（支持二级 . 号分割）
     * @return mixed
     */
    public static function pbbog_set(string $name, string $val = '')
    {
        $file = dirname(dirname(__FILE__)) . "/.env";
        $fp = fopen($file, 'r');
        if ($fp) {
            $line = 0;
            while (!feof($fp)) {
                if (strpos(fgets($fp), $name) !== false) {
                    break;
                } else {
                    ++$line;
                }
            }
            fclose($fp);

            $arr = file($file);
            $arr[$line] = "{$name}={$val}";
            foreach ($arr as &$v) {
                if ($v != '') {
                    $v = str_replace("\n", "", $v);
                }
            }
            file_put_contents($file, implode("\n", $arr));
        }
    }
}
