/**
 * 100 
 * 200 无错误
 */

jQuery(function () {
    jQuery.base64.utf8encode = true;
    jQuery.base64.utf8decode = true;
    /**
     * 获取用户数据
     * @returns 
     */
    function getoauth() {
        return new Promise((resolve, reject) => {
            jQuery.ajax({
                url: '/wp-admin/admin-ajax.php',
                data: {
                    type: "getoauth",
                    action: "pbbogapi"
                },
                type: 'get',
                dataType: 'json',
                success: function (e) {
                    if (e) { //获取过access_token
                        resolve({ code: 200, data: e, msg: '获取用户数据成功' });
                    } else { //未获取过access_token/过期
                        reject({ code: 100, data: e, msg: '获取用户数据失败' });
                    }
                },
                error: function (er) {
                    reject({ code: 100, msg: "获取用户数据失败", data: er });
                }
            });
        });
    }

    /**
     * 获取trees列表
     * @param {*} lidata li的dataset,或者文件的所有属性
     * @param {*} oauthdata 用户数据
     * @returns
     */
    function gettree(lidata = null, oauthdata) {
        return new Promise((resolve, reject) => {
            if (oauthdata == null) {
                reject({ code: 100, msg: '错误,请检查后台配置,后刷新此界面' });
                return;
            }
            if (lidata != null && lidata.mode == "100644") { // 点击一个文件
                let parsedurl = getfile({ ...lidata, ...oauthdata });
                fileshow({ ...lidata, parsedurl }, oauthdata)
                resolve({ code: 200, msg: '点击一个文件' });
                return;
            }
            if (lidata != null && lidata.isappend == "1") { //该li是否已经apend过:1已经添加过
                jQuery("#" + lidata.sha + ">ul").toggle(); //打开目录,关闭目录动作
                resolve({ code: 200, msg: '' });
                return;
            }

            jQuery.ajax({
                url: "/wp-admin/admin-ajax.php",
                data: {
                    type: "trees",
                    action: "pbbogapi",
                    access_token: oauthdata.oauth.access_token,
                    owner: oauthdata.owner,
                    repo: oauthdata.repo,
                    sha: lidata == null ? oauthdata.branche : lidata.sha,
                },
                type: 'get',
                dataType: 'json',
                beforeSend: function () {
                    if (lidata != null && lidata.sha !== "master") { //目录加载动画
                        jQuery('#' + lidata.sha).append(`<div class="d-flex justify-content-center"><div class="spinner-border text-info" role="status" style=""><span class="sr-only">Loading...</span></div></div>`);
                    }
                },
                success: async function (e) {
                    if (e.header.http_code == 401) { //用户access_token过期或身份认证错误
                        console.log("用户认证失败", e);
                        oauthdata = await getoauth().then((data) => {
                            return data.data;
                        }).catch((e) => {
                            e.msg = "获取树目录->" + e.msg;
                            console.log(e);
                            reject(e);
                            alert("出现严重错误,请检查后台配置");
                            return;
                        });
                        gettree(lidata, oauthdata);
                        return;
                    } else if (e.header.http_code !== 200) {
                        console.log("请求trees失败", e);
                        alert("出现严重错误,请检查后台配置");
                        return;
                    }

                    let tree_data = e.content.tree;

                    let innerhtml = '';
                    let msize = '';
                    let mflex = '';
                    tree_data.forEach(element => {
                        if (element.type == "blob") {
                            msize = Math.floor((element.size / 1048576) * 100) / 100 + "MB";
                            mflex = 'class="d-flex justify-content-between"';
                        }
                        innerhtml += `
                                <li id="${element.sha}" ${mflex} data-isappend="0" data-path="${element.path}" data-mode="${element.mode}" data-type="${element.type}" data-sha="${element.sha}" data-size="${element.size}" data-url="${element.url}" data-icon="${element.icon}"><span>${element.icon}&nbsp;${element.path}</span><span>${msize}</span></li>`;
                    });
                    if (e.content.sha === oauthdata.branche) { //根目录[初始化]
                        jQuery('#pbbog_trees').html(`<ul id="${e.content.sha}">` + innerhtml + `</ul>`);
                    } else {
                        jQuery('#' + e.content.sha).children().last().remove();
                        jQuery('#' + e.content.sha).append(`<ul id="${e.content.sha}" class="ml-4">` + innerhtml + `</ul>`);
                    }
                    jQuery('#' + e.content.sha).attr("data-isappend", "1"); //标记为已经获取,若更改/上传文件后,应刷新列表

                    jQuery('#' + e.content.sha + " li").each(function (i, e) { //li添加点击事件
                        jQuery(e).click(function (ec) {
                            ec.stopPropagation();

                            const data = ec.currentTarget.dataset;
                            gettree(data, oauthdata).catch((err) => {
                                err.msg = "获取目录->" + err.msg;
                                reject(err);
                                console.log(err);
                                return;
                            });
                        })
                    });

                    resolve({ code: 200, msg: '获取树成功' });
                },
                error: function (err) {
                    reject({ code: 100, data: err, msg: "获取树-请求失败" });
                }
            });
        });
    }

    /**
     * 获取文件url
     * @param {*} lidata li的dataset,或者文件的所有属性
     * @returns 
     */
    function getfile(lidata) {
        let path = [];
        jQuery("#" + lidata.sha).parentsUntil("#pbbog_trees").each(function (i, el) {
            if (el.dataset.type == "tree") {
                path.unshift(el.dataset.path);
            }
        });
        path = path.join("/") + '/' + lidata.path;
        // console.log(`http://${lidata.owner}.gitee.io/${lidata.repo}/${path}`);
        return `http://${lidata.owner}.gitee.io/${lidata.repo}/${path}`;
    }

    /**
     * 文件预览窗
     * @param {*} lidata li的dataset,或者文件的所有属性
     * @param {*} oauthdata 用户数据
     */
    function fileshow(lidata, oauthdata = null) {
        jQuery("#pbbog_file_todos").each(function (i, e) {
            jQuery(e).show();
        });
        jQuery("button[data-todo=htmltxt]").show();
        jQuery("button[data-todo=update]").show();
        jQuery("#pbbog_fileshow_mini").removeClass('d-flex').hide('slow'); //mini窗隐藏
        jQuery("#pbbog_htmltxt").attr("data-todo", "htmltxt").text('text').show(); //显示出更新按钮
        jQuery("#pbbog_filecontent").html(`<div class="d-flex justify-content-center"><div class="spinner-border text-info" role="status"><span class="sr-only">Loading...</span></div></div>`); //预加载动画

        //将真实路径赋值隐藏input
        let oInput = document.getElementById('pbbog_oInput');
        if (oInput) {
            oInput.setAttribute("value", lidata.parsedurl);
            oInput.setAttribute("data-sha", lidata.sha);
            oInput.setAttribute("data-path", lidata.path);
        } else {
            oInput = document.createElement("input");
            oInput.setAttribute("value", lidata.parsedurl);
            oInput.setAttribute("data-sha", lidata.sha);
            oInput.setAttribute("data-path", lidata.path);
            oInput.id = "pbbog_oInput";
            document.body.appendChild(oInput);
        }

        //文件预览框-文件路径
        let path = [];
        jQuery("#" + lidata.sha).parentsUntil("#pbbog_trees").each(function (i, el) {
            if (el.dataset.type == "tree") {
                path.unshift(el.dataset.path);
            }
        });
        path = path.join("/") + '/' + lidata.path;
        jQuery("#pbbog_dirbox>span").eq(0).text(path);

        let ext = lidata.path.substring(lidata.path.lastIndexOf(".") + 1);
        ext = ext.toLowerCase();
        let audioandvideos = ["mp3", "mp4", "wav", "ogg", "acc", "webm"];
        let pictures = ["jpg", "gif", "png", "apng", "avif", "bmp", "ico", "jpeg", "jfif", "pjpeg", "pjp", "svg", "tif", "tiff", "webp"];
        let innerhtml = '无内容';
        if (audioandvideos.indexOf(ext) >= 0) { //音乐和视频
            jQuery("#pbbog_file_todos>button[data-todo=update]").hide();
            innerhtml = `
          <center><video height="100%" controls>
          <source src="${lidata.parsedurl}">
          您的浏览器不支持 HTML5 video 标签。
          </video></center>
        `;
            jQuery("#pbbog_htmltxt").hide();
            jQuery("#pbbog_filecontent").html(innerhtml);
        } else if (pictures.indexOf(ext) >= 0) { //图像
            jQuery("#pbbog_file_todos>button[data-todo=update]").hide();
            innerhtml = `<center><img width="60%" src="${lidata.parsedurl}" /></center>`;
            jQuery("#pbbog_htmltxt").hide();
            jQuery("#pbbog_filecontent").html(innerhtml);
        } else { //文本
            jQuery.ajax({
                url: '/wp-admin/admin-ajax.php',
                data: {
                    action: "pbbogapi",
                    type: "getfile",
                    access_token: oauthdata.oauth.access_token,
                    owner: oauthdata.owner,
                    repo: oauthdata.repo,
                    sha: lidata.sha,
                },
                type: "get",
                dataType: "json",
                success: (res) => {
                    if (res.header.http_code == 200) {
                        innerhtml = jQuery.base64.decode(res.content.content);
                    } else {
                        innerhtml = "抱歉,转换出错";
                    }
                    jQuery("#pbbog_filecontent").text(innerhtml);
                },
                error: (err) => {
                    // console.log(err);
                    innerhtml = "抱歉,转换出错";
                    jQuery("#pbbog_filecontent").text(innerhtml);
                }
            })
            jQuery("#pbbog_htmltxt").show();
        }
        jQuery("#pbbog_fileshow").show('slow');
    }

    /**
     * right-aside2body 将添加到右侧侧的元素移动,自定义位置
     * @returns 
     */
    function aside2body() {
        jQuery('body').prepend(jQuery('#pbbog_giteebedtem').clone(true).attr({ 'id': 'pbbog_giteebed' }));
        jQuery('body').prepend(jQuery('#pbbog-meta-btmtemp').clone(true).attr({ 'id': 'pbbog-meta-btn' }));
        jQuery('body').prepend(jQuery('#pbbog_fileshowtem').clone(true).attr({ 'id': 'pbbog_fileshow' }));
        jQuery('body').prepend(jQuery('#pbbog_downloadfiletem').clone(true).attr({ 'id': 'pbbog_downloadfile' }));
        jQuery('body').prepend(jQuery('#pbbog_fileshow_minitem').clone(true).attr({ 'id': 'pbbog_fileshow_mini' }));

        jQuery('#pbbog_giteebedtem').remove();//移除旧模态框
        jQuery('#pbbog-meta-btmtemp').remove();//移除旧按钮元素
        jQuery('#pbbog_fileshowtem').remove();//移除旧文件内容框
        jQuery('#pbbog_downloadfiletem').remove();//移除旧下载a链接
        jQuery('#pbbog_fileshow_minitem').remove();
        jQuery("#pbbog-meta-box-id").hide();//移除旧工具元素
        return 1;
    }

    //防抖
    function pbbog_debounce(fn, wait) {
        let timer, startTimeStamp = 0;
        let context, args;

        let run = (timerInterval) => {
            timer = setTimeout(() => {
                let now = (new Date()).getTime();
                let interval = now - startTimeStamp
                if (interval < timerInterval) {
                    startTimeStamp = now;
                    run(wait - interval);
                } else {
                    fn.apply(context, args);
                    clearTimeout(timer);
                    timer = null;
                }

            }, timerInterval);
        }

        return function () {
            context = this;
            args = arguments;
            let now = (new Date()).getTime();
            startTimeStamp = now;

            if (!timer) {
                console.log("已经点过了");
                run(wait);
            }

        }

    }

    /**
     * 插件初始化函数
     */
    async function pbbog_init() {
        //侧边栏移到body-before
        console.log("aside2b-begin");
        var aside2b = await aside2body();
        console.log("aside2b-end", aside2b);
        //初始化用户数据
        console.log("oauthdata-begin");
        var oauthdata = await getoauth().then((data) => {
            return data.data;
        }).catch((err) => {
            err.msg = "插件初始化-" + err.msg;
            console.log("插件初始化-", err);
            alert(err.msg);
            return;
        });
        console.log("oauthdata-end", oauthdata);
        //初始化树
        //console.log("trees-begin");
        var gittree_type = false;
        jQuery("#pbbog-meta-btn").on('click', async function () { //打开模态框-只触发一次,以后靠更新
            jQuery("#pbbog_fileshow").hide(); //关闭文件预览窗
            jQuery("#pbbog_fileshow_mini").removeClass('d-flex').hide('slow'); //mini窗隐藏
            jQuery('#pbbog_giteebed').modal('toggle');
            if (!gittree_type) {
                gettree(null, oauthdata).catch(function (err) {
                    err.msg = "插件初始化-监听模态框打开-" + err.msg;
                    console.log(err);
                    alert("获取目录失败,请尝试刷新,或提交技术支持" + err.msg);
                    return;
                });
                gittree_type = true;
            }
        });
        // console.log("aside2b-after");

        //文件预览窗-操作组
        jQuery("#pbbog_file_todos>button").each(async function (i, el) {
            jQuery(el).click(async (e) => {
                e.stopPropagation();
                let todo = e.currentTarget.dataset.todo; //动作
                if (todo == "copy") {
                    let oInput = document.getElementById('pbbog_oInput');
                    if (oInput) {
                        navigator.clipboard.writeText(oInput.value).then(function () {
                            alert("复制成功");
                        }, function () {
                            alert("复制失败");
                        });
                    }
                } else if (todo == "download") {
                    let urlData = document.getElementById('pbbog_oInput').value;
                    jQuery("#pbbog_downloadfile").attr({ "href": urlData, "download": urlData });
                    jQuery("#pbbog_downloadfile>span").click();
                } else if (todo == "del") {
                    let urlData = document.getElementById('pbbog_oInput');
                    let delmeaasage = prompt("message", "");
                    if (delmeaasage != null && delmeaasage != "") {
                        console.log({
                            action: "pbbogapi",
                            type: "delfile",
                            access_token: oauthdata.oauth.access_token,
                            owner: oauthdata.owner,
                            repo: oauthdata.repo,
                            branch: oauthdata.branche,
                            path: jQuery("#pbbog_dirbox>span").eq(0).text(),
                            sha: urlData.dataset.sha,
                            message: delmeaasage
                        });
                        jQuery.ajax({
                            url: '/wp-admin/admin-ajax.php',
                            data: {
                                action: "pbbogapi",
                                type: "delfile",
                                access_token: oauthdata.oauth.access_token,
                                owner: oauthdata.owner,
                                repo: oauthdata.repo,
                                branch: oauthdata.branche,
                                path: jQuery("#pbbog_dirbox>span").eq(0).text(),
                                sha: urlData.dataset.sha,
                                message: delmeaasage
                            },
                            type: "get",
                            dataType: "json",
                            success: async (res) => {
                                console.log("删除文件", res);
                                if (res.header.http_code == 200) {
                                    //关闭预览窗
                                    jQuery("#pbbog_filecontent").html('');
                                    jQuery("#pbbog_fileshow").hide('slow');
                                    //刷新目录
                                    jQuery("#pbbog_trees").html(`<div class="d-flex justify-content-center"><div class="spinner-border text-info" role="status"><span class="sr-only">Loading...</span></div></div>`);
                                    await gettree(null, oauthdata).then((data) => {
                                        alert("删除成功");
                                        return;
                                    }).catch((err) => {
                                        err.msg = "删除文件-删除成功-重新获取tree-" + err.msg;
                                        console.log(err);
                                        alert("已删除,刷新目录出错" + err.msg);
                                        return;
                                    });
                                } else {
                                    alert("删除失败");
                                }
                            },
                            error: (err) => {
                                console.log("删除失败", err);
                            }
                        })
                    }
                } else if (todo == "htmltxt") {
                    jQuery("button[data-todo=update]").show();
                    let gethtmltxtid = jQuery("#pbbog_htmltxt").text();
                    jQuery.ajax({
                        url: '/wp-admin/admin-ajax.php',
                        data: {
                            action: "pbbogapi",
                            type: "getfile",
                            access_token: oauthdata.oauth.access_token,
                            owner: oauthdata.owner,
                            repo: oauthdata.repo,
                            sha: document.getElementById('pbbog_oInput').dataset.sha,
                        },
                        type: "get",
                        dataType: "json",
                        beforeSend: () => {
                            jQuery("#pbbog_filecontent").html(`<div class="d-flex justify-content-center"><div  class="spinner-border text-info" role="status"><span class="sr-only">Loading...</span></div></div>`);
                        },
                        success: (res) => {
                            if (res.header.http_code == 200) {
                                let contents = jQuery.base64.decode(res.content.content)
                                if (gethtmltxtid == "text") {
                                    jQuery("#pbbog_filecontent").html(contents);
                                    jQuery("#pbbog_htmltxt").text("html");
                                } else if (gethtmltxtid == "html") {
                                    jQuery("#pbbog_filecontent").text(contents);
                                    jQuery("#pbbog_htmltxt").text("text");
                                }
                            } else {
                                jQuery("#pbbog_filecontent").text("抱歉,转换出错");
                            }
                        },
                        error: (err) => {
                            // console.log(err);
                            jQuery("#pbbog_filecontent").html("抱歉,转换出错" + err.responseText);
                        }
                    });
                } else if (todo == "update") {
                    jQuery("button[data-todo=update]").hide();
                    jQuery('#pbbog_giteebed').modal('hide');
                    let path = jQuery("#pbbog_oInput").attr('data-path');
                    let dir = jQuery("#pbbog_dirbox>span").eq(0).text();
                    let ext = path.substring(path.lastIndexOf(".") + 1);
                    ext = ext.toLowerCase();
                    let audioandvideos = ["mp3", "mp4", "wav", "ogg", "acc", "webm"];
                    let pictures = ["jpg", "gif", "png", "apng", "avif", "bmp", "ico", "jpeg", "jfif", "pjpeg", "pjp", "svg", "tif", "tiff", "webp"];

                    if (audioandvideos.indexOf(ext) >= 0 || pictures.indexOf(ext) >= 0) { //音乐/视频/图像
                        /* jQuery("#pbbog_filecontent").html(`
                        <form action="#">
                            <div class="form-group">
                                <label for="files_inputsb">文件</label>
                                <input type="file" class="form-control-file col-5" name="files_inputsb" id="files_inputsb">
                                <p id="files_uptypesb"></p>
                            </div>
                            <div class="form-group">
                                <label for="files_messageb">提交信息</label>
                                <input type="text" class="form-control col-5" name="files_messageb">
                            </div>
                            <button type="button" class="btn btn-primary" id="file_upyesbtnb">确认上传</button>
                            <button type="button" class="btn btn-secondary" id="file_resetbtnb">重置</button>
                        </form>`);

                        //文件预览框-监听上传[文件
                        jQuery("#file_upyesbtnb").on('click', function () {
                            let sha = jQuery("#pbbog_oInput").attr('data-sha');
                            //let dir = jQuery("input[name=files_dirb]").val();
                            let files = jQuery("#files_inputsb").prop('files')[0];
                            let message = jQuery("input[name=files_messageb]").val();
                            if (message == "" || files.length == 0 || dir == '' || sha == '') {
                                return;
                            }
                            jQuery("#files_uptypesb").html('');
                            let reader = new FileReader();
                            reader.readAsDataURL(files);
                            reader.onload = function () {
                                let base = reader.result.split(";base64,")[1];

                                let formData = new FormData();
                                formData.append("access_token", oauthdata.oauth.access_token);
                                formData.append("content", base);
                                formData.append("sha", sha);
                                formData.append("message", message);
                                formData.append("branch", oauthdata.branche);
                                jQuery.ajax({
                                    url: `https://gitee.com/api/v5/repos/${oauthdata.owner}/${oauthdata.repo}/contents/${dir}`,
                                    data: formData,
                                    processData: false,
                                    contentType: false,
                                    type: "PUT",
                                    dataType: "text",
                                    beforeSend: () => {
                                        jQuery("#files_uptypesb").append(`<span class="badge badge-pill badge-secondary">${files.name}-上传中...</span>`);
                                    },
                                    success: (res) => {
                                        jQuery("#files_uptypesb>span").text(files.name).removeClass("badge-secondary").addClass("badge-success");
                                        console.log("上传文件成功", res)
                                    },
                                    error: (err) => {
                                        jQuery("#files_uptypesb>span").text(files.name).removeClass("badge-secondary").addClass("badge-danger");
                                        console.log("上传文件失败", err);
                                    }
                                });
                            }
                        });
                        //文件预览窗-表单重置
                        jQuery("#file_resetbtnb").on('click', function () {
                            jQuery("#pbbog_filecontent input").each(function (i, e) {
                                jQuery(e).val('');
                            })
                        }); */
                    } else { //文本
                        jQuery("#pbbog_filecontent").html(`
                        <form action="#">
                            <div class="form-group">
                                <label for="files_textarea">文本</label>
                                <textarea type="text" class="form-control" name="files_textarea" value=""></textarea>
                                <p id="files_uptypesc"></p>
                            </div>
                            <div class="form-group">
                                <label for="files_messagec">提交信息</label>
                                <input type="text" class="form-control col-5" name="files_messagec">
                            </div>
                            <button type="button" class="btn btn-primary" id="file_upyesbtnc">确认上传</button>
                            <button type="button" class="btn btn-secondary" id="file_resetbtnc">重置</button>
                        </form>`);

                        jQuery.ajax({
                            url: '/wp-admin/admin-ajax.php',
                            data: {
                                action: "pbbogapi",
                                type: "getfile",
                                access_token: oauthdata.oauth.access_token,
                                owner: oauthdata.owner,
                                repo: oauthdata.repo,
                                sha: document.getElementById('pbbog_oInput').dataset.sha,
                            },
                            type: "get",
                            dataType: "json",
                            beforeSend: () => {
                                jQuery('textarea[name=files_textarea]').attr({ "readonly": true, "placeholder": "请稍等..." });
                            },
                            success: (res) => {
                                jQuery('textarea[name=files_textarea]').removeAttr("readonly");
                                jQuery('textarea[name=files_textarea]').attr("placeholder", "");
                                if (res.header.http_code == 200) {
                                    jQuery('textarea[name=files_textarea]').val(jQuery.base64.decode(res.content.content)).focus();
                                } else {
                                    jQuery('textarea[name=files_textarea]').attr("placeholder", "抱歉,转换出错");
                                    contents = "";
                                }
                            },
                            error: (err) => {
                                // console.log(err);
                                jQuery('textarea[name=files_textarea]').attr("placeholder", "抱歉,转换出错" + err.responseText);
                            }
                        });
                        //文件预览窗-文本表单重置
                        jQuery("#file_resetbtnc").on('click', function () {
                            jQuery("#pbbog_filecontent input,textarea").each(function (i, e) {
                                jQuery(e).val('');
                            })
                        });
                        //文件预览框-监听上传文本
                        jQuery("#file_upyesbtnc").on('click', function () {
                            let sha = jQuery("#pbbog_oInput").attr('data-sha');
                            //let dir = jQuery("input[name=files_dirc]").val();
                            let textcontent = jQuery('textarea[name=files_textarea]').val();
                            let message = jQuery("input[name=files_messagec]").val();
                            console.log(sha, dir, textcontent, message);
                            if (message == "" || dir == "" || textcontent == "") {
                                return;
                            }

                            jQuery("#files_uptypesc").text('');
                            let formData = new FormData();
                            formData.append("access_token", oauthdata.oauth.access_token);
                            formData.append("content", jQuery.base64.encode(textcontent));
                            formData.append("sha", sha);
                            formData.append("message", message);
                            formData.append("branch", oauthdata.branche);
                            jQuery.ajax({
                                url: `https://gitee.com/api/v5/repos/${oauthdata.owner}/${oauthdata.repo}/contents/${dir}`,
                                data: formData,
                                processData: false,
                                contentType: false,
                                type: "PUT",
                                dataType: "text",
                                beforeSend: () => {
                                    jQuery("#files_uptypesc").html(`<span class="badge badge-pill badge-secondary">上传中...</span>`);
                                },
                                success: (res) => {
                                    jQuery("#files_uptypesc>span").text('上传成功').removeClass("badge-secondary").addClass("badge-success");
                                    console.log("上传文件成功", res)
                                },
                                error: (err) => {
                                    jQuery("#files_uptypesc>span").text('上传失败').removeClass("badge-secondary").addClass("badge-danger");
                                    console.log("上传文件失败", err);
                                }
                            });
                        });
                    }
                } else {
                    alert("不支持的操作");
                    console.log("不支持的操作");
                }
            });
        });
        //文件预览窗->关闭[内容清空]
        jQuery('#gbdb_closefilesclose').on('click', function () {
            jQuery("#pbbog_filecontent").html('');
            jQuery("#pbbog_fileshow").hide('slow');
        });
        //文件预览窗->mini窗
        jQuery('#gbdb_closefileshide').on('click', function () {
            jQuery("#pbbog_fileshow").hide('slow');
            jQuery("#pbbog_fileshow_mini").addClass('d-flex').show('slow');
        });
        //mini窗->文件预览窗
        jQuery('#pbbog_fileshow_mini').on('click', function () {
            jQuery("#pbbog_fileshow_mini").removeClass('d-flex').hide('slow');
            jQuery("#pbbog_fileshow").show('slow');
        });

        //模态窗-标题[当前的仓库名]
        jQuery("#pbbog_giteebedLabel").text(oauthdata.repo);
        //模态窗-仓库目录-刷新
        let timesa = null;
        jQuery("#pbbog_refresh_dir").on('click', pbbog_debounce(function () {
            jQuery('#pbbog_trees').html(`<div class="d-flex justify-content-center"><div class="spinner-border text-info" role="status"><span class="sr-only">Loading...</span></div></div>`);
            gettree(null, oauthdata).then((data) => {
                console.log(data);
            }).catch((err) => {
                err.msg = "仓库目录-刷新-" + err.msg;
                console.log(err);
                alert(err.msg);
            });
        }, 3500));
        //模态窗-文件-Pages部署
        jQuery("#pbbog_gitee_pages").attr({
            "href": `https://gitee.com/${oauthdata.owner}/${oauthdata.repo}/pages`,
            "target": "__blank"
        });
        //模态窗-文件-上传文件-确认上传
        jQuery("#pbbog_file_upyesbtn").on('click', function () {
            let files = jQuery("#pbbog_files_inputs").prop('files');
            let path = jQuery("input[name=pbbog_files_dir]").val() ?? '';
            let message = jQuery("input[name=pbbog_files_message]").val();
            if (message == "" || files.length == 0) {
                return;
            }
            jQuery("#pbbog_files_uptypes").html('');

            for (let i = 0; i < files.length; i++) {
                if (files[i]) {
                    let reader = new FileReader();
                    reader.readAsDataURL(files[i]);
                    reader.onload = function () {
                        let base = reader.result.split(";base64,")[1];

                        let formData = new FormData();
                        formData.append("access_token", oauthdata.oauth.access_token);
                        formData.append("content", base);
                        formData.append("message", message);
                        formData.append("branch", oauthdata.branche);
                        console.log({ "access_token": oauthdata.oauth.access_token, "content": base, "message": message, "branch": oauthdata.branche });
                        jQuery.ajax({
                            url: `https://gitee.com/api/v5/repos/${oauthdata.owner}/${oauthdata.repo}/contents/${path + files[i].name}`,
                            data: formData,
                            processData: false,
                            contentType: false,
                            type: "POST",
                            dataType: "text",
                            beforeSend: () => {
                                jQuery("#pbbog_files_uptypes").append(`<span data-filei=f${i} class="badge badge-pill badge-secondary">${files[i].name}-上传中...</span>`);
                            },
                            success: (res) => {
                                jQuery("#pbbog_files_uptypes>span[data-filei=f" + i).text(files[i].name).removeClass("badge-secondary").addClass("badge-success");
                                console.log("上传文件成功", res)
                            },
                            error: (err) => {
                                jQuery("#pbbog_files_uptypes>span[data-filei=f" + i).text(files[i].name).removeClass("badge-secondary").addClass("badge-danger");
                                console.log("上传文件失败", err);
                            }
                        });
                    }
                }
            }
        });
        //模态窗-文件-上传文件-重置
        jQuery("#pbbog_file_resetbtn").on('click', function () {
            jQuery("input[name=pbbog_files_dir]").val('');
            jQuery("input[name=pbbog_files_message]").val('');
            jQuery("#pbbog_files_inputs").val('');
            jQuery("#pbbog_files_uptypes").html('');
        });
    }

    pbbog_init();
});