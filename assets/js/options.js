jQuery(document).ready(function () {
    let curtime_interval = null;

    //表单数据env
    function init_form() {
        jQuery.ajax({
            url: "/wp-admin/admin-ajax.php",
            type: "post",
            data: {
                action: 'pbbogapi',
                type: 'getenv'
            },
            dataType: "json",
            success: function (res) {
                console.log('获取env', res);
                if (res != []) {
                    if (res.oauth) {
                        jQuery("#overtime").text((new Date((res.oauth.created_at + res.oauth.expires_in) * 1000).toLocaleString()));
                        if(curtime_interval){
                            clearInterval(curtime_interval);
                        }
                        curtime_interval = setInterval(function () {
                            jQuery("#curtime").text(new Date().toLocaleString());
                        }, 1000);
                        jQuery("#overtime_block").show();
                        jQuery("#overtime_block + p.text-muted").show();
                    }

                    jQuery("input[name=email]").val(res.username);
                    jQuery("input[name=password]").val(res.password);
                    jQuery("input[name=client_id]").val(res.client_id);
                    jQuery("input[name=client_secret]").val(res.client_secret);
                    jQuery("input[name=owner]").val(res.owner);
                    jQuery("input[name=repo]").val(res.repo);
                    jQuery("input[name=branche]").val(res.branche);

                    let scopes = res.scopes.split(" ");
                    jQuery("input[name=scopes]").each(function (i, el) {
                        if (scopes.indexOf(jQuery(el).attr("id")) >= 0) {
                            jQuery(el).prop("checked", true);
                        }
                    });

                    jQuery("form[path=init] input").each((i, e) => {
                        jQuery(e).removeAttr("readonly");
                    });
                    jQuery("form[path=init] button").each((i, e) => {
                        jQuery(e).removeAttr("disabled");
                    });
                }
            }
        });
    }
    init_form();

    //表单提交处理
    jQuery(".form").each(function (i, e) {
        jQuery(e).click(function () {
            let data = {};
            let value = jQuery(this).parent().serializeArray();
            let path = jQuery(this).parent().attr('path');
            jQuery.each(value, function (index, item) {
                data[item.name] = item.value;
            });
            if (path == "init") {
                data.scopes = [];
                jQuery('input[name="scopes"]:checked').each(function (index, item) {
                    data.scopes.push(item.value);
                });
            }
            // console.log(data);
            data['type'] = path;
            data['action'] = 'pbbogapi';
            jQuery.ajax({
                url: "/wp-admin/admin-ajax.php",
                type: "post",
                data,
                dataType: "json",
                beforeSend: function () {
                    jQuery("form[path=" + path + "] input").each((i, eb) => {
                        jQuery(eb).attr("readonly", true);
                    });
                    jQuery("form[path=" + path + "] button").each((i, ec) => {
                        jQuery(ec).attr("disabled", true);
                    });
                },
                success: function (res) {
                    jQuery("#showtags").html(`<div class="notice notice-success"><p>${res.content.msg}<p></div>`).show('slow');
                    init_form();
                    console.log(res);
                },
                error: function (e) {
                    console.log(e);
                },
                complete: function () {
                    jQuery("form[path=" + path + "] input").each((i, ed) => {
                        jQuery(ed).removeAttr("readonly");
                    });
                    jQuery("form[path=" + path + "] button").each((i, ed) => {
                        jQuery(ed).removeAttr("disabled");
                    });
                    let timeo = setTimeout(function () {
                        jQuery("#showtags").hide('slow');
                        clearTimeout(timeo);
                    }, 5000);
                }
            });
        });
    });

    //全选
    jQuery("#scopes_all").change(function (e) {
        jQuery('input[name="scopes"]').each(function (index, item) {
            item.checked = e.currentTarget.checked;
        });
    });
});