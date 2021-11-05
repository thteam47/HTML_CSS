/**
 * Created by Glee on 24-May-18.
 * File file requires BuildPC.js file. Custom display for each client
 * Dependency: window.BUILD_PRODUCT_TYPE
 */
var BuildPCVisual = function (_objBuildPC) {

    var objBuildPC = _objBuildPC;
    var BUILD_PRODUCT_TYPE = objBuildPC.getBuildId();
    var ACTION_URL = "https://www.hanoicomputer.vn/ajax/get_json.php";
    var $layout_container = $("#js-buildpc-layout");
    var $modal_container = $("#js-modal-popup");
    var row_tpl = `<div class="item-drive">
                            <span class="d-name">{{counter}}. {{name}}</span>
                            <div class="drive-checked">
                                <span class="show-popup_select span-last open-selection" id="js-category-info-{{id}}" data-info='{{info}}'><i class="fa fa-plus"></i> Chọn {{name}}</span>
                                <div id="js-selected-item-{{id}}"></div>
                            </div>
                        </div>`;
    var product_tpl = `<div class="contain-item-drive" data-category_id="{{category_id}}" data-product_id="{{id}}">
                            <a target="_blank" href="{{url}}" class="d-img">{{image}}</a>
                            <span class="d-name">
                                <a target="_blank" href="{{url}}"> {{name}}  </a> <br>
                                Mã sản phẩm: {{sku}} <br>
                                Bảo hành: {{warranty}} <br>
                                Kho hàng: {{stock_status}}
                            </span>
                            <span class="d-price">{{price}}</span>
                            <i>x</i> <input class="count-p" type="number" value="{{quantity}}" min="1" max="50"><i>=</i>
                            <span class="sum_price">{{price_sum}}</span>
                            <span class="btn-action_seclect show-popup_select"><i class="fas fa-edit edit-item"></i></span>
                            <span class="btn-action_seclect delete_select"><i class="fas fa-trash-alt remove-item"></i></span>
                        </div>`;

    var $summary_holder = $('.js-config-summary');
    var summary_tpl = `<span class="total-price-config">{{total_value}} đ</span><p>{{static_text}}</p>`;

    var _open_category_info;

    //show the layout
    function showLayout(category_config) {
        var html = [];
        category_config.forEach(function (item, index) {
            html.push(translateTemplate({
                counter : index + 1,
                id : item.id,
                name : item.name,
                info : JSON.stringify(item)
            }, row_tpl));
        });
        $layout_container.html(html.join(""));

        //show summary
        displaySelectedConfigSummary();

        // remove previous listener if exist
        $layout_container.off("click");
        $layout_container.off("change");
        $modal_container.off("click");

        //add new listener on click
        $layout_container.on("click", function (e) {
            var node            = e.target;
            var $this_ele       = $(node);
            var $div_container  = $this_ele.closest("div");
            var category_id     = $div_container.data("category_id");
            var product_id      = $div_container.data("product_id");

            console.log("Node clicked = " + node.nodeName);

            //click on category to select a product
            if($this_ele.hasClass('open-selection')) {
                console.log("show selection");
                var item_info       = JSON.parse(node.getAttribute("data-info"));

                //console.log(item_info);
                showProductListToSelect(item_info);
                return true;
            }

            //change product quantity
            if($this_ele.hasClass('count-p')) {
                var new_quantity    = $div_container.find(".count-p").val();
                var product_price   = parsePrice($div_container.find(".d-price").html());
                //change config
                objBuildPC.updateItem(category_id, product_id, "quantity", new_quantity);
                //show new sum
                $div_container.find(".sum_price").html( writeStringToPrice(parseInt(new_quantity) * parseInt(product_price)));

                //show summary
                displaySelectedConfigSummary();

                return true;
            }

            //remove product
            if($this_ele.hasClass('remove-item')) {
                //ask for confirmation
                if(!confirm('Bạn muốn bỏ sản phẩm này ?')) return false;

                console.log("remove product = " + product_id);
                //change config
                objBuildPC.removeItem(category_id, product_id, function (category_id, product_id) {
                    $("#js-selected-item-" + category_id).html('');
                    //then save
                    saveConfig();
                });
                //show summary
                displaySelectedConfigSummary();
                return true;

            }

            //edit product
            if($this_ele.hasClass('edit-item')) {
                console.log("edit product = " + product_id);
                var category_info = $("#js-category-info-"+category_id).data("info");

                showProductListToSelect(category_info);

                //remove item first then open list for selection
                /*objBuildPC.removeItem(category_id, product_id, function (category_id, product_id) {
                    $("#js-selected-item-" + category_id).html('');
                    showProductListToSelect(category_info);
                    //then save
                    saveConfig();
                });*/
                return true;
            }

        });

        $layout_container.on("change", function (e) {
            var node            = e.target;
            var $this_ele       = $(node);
            var $div_container  = $this_ele.closest("div");
            var category_id     = $div_container.data("category_id");
            var product_id      = $div_container.data("product_id");

            //change product quantity
            if($this_ele.hasClass('count-p')) {
                var new_quantity    = $div_container.find(".count-p").val();
                var product_price   = parsePrice($div_container.find(".d-price").html());
                //change config
                objBuildPC.updateItem(category_id, product_id, "quantity", new_quantity);
                //show new sum
                $div_container.find(".sum_price").html( writeStringToPrice(parseInt(new_quantity) * parseInt(product_price)));

                //then save
                saveConfig();

                return true;
            }
        });

        //listen for product selection on modal open
        $modal_container.on("click", function (e) {
            var node = e.target;
            if($(node).hasClass('js-select-product')) {
                var product_id = JSON.parse(node.getAttribute("data-id"));
                //alert(product_id);
                //get product info and add to selection
                addProductToList(_open_category_info, product_id);
            }
        })
    }

    //load product selection
    function showProductListToSelect(category_info) {
        $modal_container.html('Đang tải dữ liệu');
        _open_category_info = Object.assign({}, category_info);

        //send currently selected parts so we can narrow the related parts
        var current_selected_parts = [];//pc_part_id
        var current_config = objBuildPC.getConfig();
        for(var cat_id in current_config) {
            if(current_config.hasOwnProperty(cat_id) &&
                current_config[cat_id].hasOwnProperty('items') &&
                current_config[cat_id]['items'].length > 0
            ) {
                current_selected_parts.push(current_config[cat_id]['items'][0]['id'] + '-' + cat_id);
            }
        }

        $.get( ACTION_URL, {
            action     : "pcbuilder",
            action_type : "get-product-category",
            category_id : category_info.id,
            pc_part_id : current_selected_parts.join(","),
            storeId: ($('#js-buildpc-select-store').length > 0) ? $('#js-buildpc-select-store input[name=radio-khohang]:checked').val() : ''
        } , function (data) {
            $modal_container.html(data);
            console.log(category_info);
            $('#default-store').attr({'data-info':category_info.id , 'data-part-id' : current_selected_parts.join(",") });
        });
    }

    //loc kho hang theo tat ca
    function showAllProductFilter(filter_all_url) {
        let filterAll = filter_all_url.split('&storeId');

        $modal_container.html('Đang tải dữ liệu');
        $.get( filterAll[0], {} , function (data) {
            $modal_container.html(data);
        });
    }

    //load product selection filter
    function showProductFilter(filter_url) {
        $modal_container.html('Đang tải dữ liệu');
        $.get( filter_url, {} , function (data) {
            $modal_container.html(data);
        });
    }

    function deleteSelectedConfig() {
        return objBuildPC.emptyConfig();
    }

    function checkPromotionByCondition(current_value, arr_category_list) {
        console.log('checkPromotionByCondition: value='+ current_value + ' - category=' + JSON.stringify(arr_category_list));

        let url = 'https://www.hanoicomputer.vn/ajax/get_json.php?action=promotion&action_type=condition';
        url += '&value=' + current_value;
        url += '&category=' + arr_category_list.join('-');
        $.get(url, function (res){
            console.log(JSON.stringify(res));
            if(res.status === 'success') {
                if(typeof window['showUserBuildPCPromotion'] == 'function') {
                    window['showUserBuildPCPromotion'](res.data.promotion , res.data.title);
                }else{
                    console.error("You need to define function showUserBuildPCPromotion(promotion_html,promotion_title){alert(promotion_html)} ");
                }
            } else {
                window['showUserBuildPCPromotion']('' , '');
            }
        })
    }

    function getConfigSummary() {
        var pc_config = objBuildPC.getConfig();
        var total_value = 0, total_quantity = 0, total_item = 0, item;
        var static_text = ' ' ;

        for ( var category_id in pc_config ) {
            if(pc_config.hasOwnProperty(category_id)) {
                item = pc_config[category_id].items[0];
                total_value += item.price * item.quantity;
                total_quantity += item.quantity;
                total_item += 1;
            }
        }
        
        return {
            total_value : total_value,
            total_quantity : total_quantity,
            total_item : total_item,
            static_text : static_text
        };
    }

    //display total value & items
    function displaySelectedConfigSummary() {
        var summary = getConfigSummary() ;

        if($summary_holder) {
            $summary_holder.html(translateTemplate({
                total_value : writeStringToPrice(summary.total_value),
                total_quantity : summary.total_quantity,
                total_item : summary.total_item,
                static_text : summary.static_text
            }, summary_tpl ));
        }

        // show promotion
        checkPromotionByCondition(summary.total_value, Object.keys(objBuildPC.getConfig()));
    }

    //show currently selected config
    function showSelectedConfig() {
        $.get(ACTION_URL, {
            action     : "pcbuilder",
            action_type : "get-summary",
            category_id : category_id
        } , function (data) {
            $modal_container.html(data);
        })
    }

    function displayProductInCategory(category_id, product_info) {
        console.log("display product in: " + "#js-selected-item-" + category_id);
        $("#js-selected-item-" + category_id).html(translateTemplate({
            id : product_info.id,
            category_id : category_id,
            image : '<img src="'+ product_info.image +'">',
            name : product_info.name,
            stock_status : (product_info.stock > 0) ? "Còn hàng" : "Hết hàng",
            quantity : product_info.quantity,
            url : product_info.url,
            price : writeStringToPrice(product_info.price),
            price_sum : writeStringToPrice(parseInt(product_info.price) * parseInt(product_info.quantity)),
            sku : product_info.sku,
            warranty : (product_info.warranty) ? product_info.warranty : ""
        }, product_tpl ));
    }


    //helpers
    function addProductToList(category_info, product_id) {

        if( objBuildPC.isItemInCategory(category_info.id, product_id)) {
            console.log("product already selected, no need to update !");
            //and close modal and remove content
            $modal_container.html('');
            return false;
        }

        //check if category has a product before (i.e. when click on edit item), first remove it
        $("#js-selected-item-" + category_info.id).html('');
        objBuildPC.emptyCategory(category_info.id);

        $.get(ACTION_URL, {
            action     : "product",
            action_type : "basic-info",
            id : product_id
        } , function (data) {
            var product_info = JSON.parse(data);
            var item_info = {
                id      : product_info.id,
                name    : product_info.productName,
                sku :   product_info.productSKU,
                description : product_info.proSummary,
                image   : product_info.productImage.small,
                price   : product_info.price,
                url     : product_info.productUrl,
                stock : product_info.quantity,
                quantity : 1,
                price_sum : writeStringToPrice(parseInt(product_info.price)),
                warranty : product_info.warranty,
                note : "",
            };
            var display_callback = function () {
                //show display
                displayProductInCategory(category_info.id, item_info);
                //and close modal and remove content
                $modal_container.html('');
                //then save
                saveConfig();
            };

            //console.log(data);
            objBuildPC.selectItem(category_info, item_info, display_callback);
        });
    }

    function currentDomain() {
        var url = window.location;
        return url.protocol + '://' + url.hostname;
    }

    function translateTemplate(key_value, tpl){
        var translated_tpl = tpl;
        for(var key in key_value){
            if(key_value.hasOwnProperty(key)){
                translated_tpl = translated_tpl.replace(new RegExp("{{"+key+"}}","g"), key_value[key]);
            }
        }
        return translated_tpl;
    }

    function writeStringToPrice(str){
        str = (str+'').replace(/\./g, "");
        var first_group = str.substr(0,str.length % 3);
        var remain_group = str.replace(first_group,"");
        var num_group = remain_group.length/3;
        var result = "";
        for(var i=0;i < num_group;i++){
            group_of_three = remain_group.substr(i*3,3);
            result += group_of_three;
            if(i != (num_group-1)) result += ".";
        }
        if(first_group.length > 0) {
            if(result != "") return first_group + "." + result ;
            else return first_group;
        }else{
            if(result != "") return result;
            else return "";
        }
    }

    function parsePrice(price){
        price = (price+'').replace(/\./g, "");
        return parseInt(price.replace(/\,/g, ""));
    }

    function saveConfig() {
        Hura.User.updateInfo(BUILD_PRODUCT_TYPE, objBuildPC.getConfig(), function (res) {
            if(res.status == 'success') {
                //alert("Lưu thành công !");
            }
        });

        //show summary
        displaySelectedConfigSummary();
    }

    return {
        showLayout: showLayout,
        showProductFilter : showProductFilter,
        showSelectedConfig : showSelectedConfig,
        displayProductInCategory : displayProductInCategory,
        deleteSelectedConfig : deleteSelectedConfig,
        displaySummary : displaySelectedConfigSummary,
        showAllProductFilter: showAllProductFilter,
        getConfigSummary : getConfigSummary
    }
};