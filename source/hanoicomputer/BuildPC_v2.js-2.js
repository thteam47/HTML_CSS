"use strict";
class BuildPC {
    constructor(build_id) {
        //props
        this.select_config = {
            //category_id => info
            /*"12" : {
                 info : {
                     id : 12,
                     name : "Bo mạch chủ",
                 },
                 items : [
                     {
                         id      : 12,
                         name    : "",
                         sku :   "",
                         description : "",
                         image   : "",
                         price   : 0,
                         quantity : 1,
                         note : "",
                         stock : 12,
                         price_sum : ',
                         warranty : '',
                     },
                         //..other items. one category may have many products
                ],
             },*/
            //...
        };
        this.build_id = build_id;
    }
    //add an item/product to list
    selectItem(category_info, item_info, display_fn) {
        //in case, select_config = [], then make it an object
        if (Array.isArray(this.select_config))
            this.select_config = {};
        //add category if not exist
        this.addCategory(category_info);
        //add if not exist
        if (this.getItemIndexInCategory(category_info.id, item_info.id) == -1) {
            this.select_config[category_info.id].items.push(item_info);
            //show visually
            if (typeof display_fn === 'function')
                display_fn();
        }
    }
    //update item: like quantity, note
    updateItem(category_id, item_id, update_key, new_value) {
        const item_index = this.getItemIndexInCategory(category_id, item_id);
        if (item_index > -1) {
            this.select_config[category_id].items[item_index][update_key] = new_value;
        }
    }
    //remove an item/product from list
    removeItem(category_id, item_id, display_fn) {
        let item_index = this.getItemIndexInCategory(category_id, item_id);
        if (item_index > -1) {
            //delete item from array
            this.select_config[category_id].items.splice(item_index, 1);
            //if category empty, delete the whole category
            if (this.select_config[category_id].items.length == 0) {
                this.emptyCategory(category_id);
            }
            //show visually
            if (typeof display_fn === 'function')
                display_fn(category_id, item_id);
        }
    }
    getConfig() {
        return this.select_config;
    }
    getBuildId() {
        return this.build_id;
    }
    //set config, ie. user's previously saved config
    setConfig(config) {
        this.select_config = Object.assign({}, config);
    }
    emptyConfig() {
        this.select_config = {};
    }
    //check item in category
    isItemInCategory(category_id, item_id) {
        return (this.getItemIndexInCategory(category_id, item_id) > -1);
    }
    getItemIndexInCategory(category_id, item_id) {
        let item_index = -1; //non-exist
        if (this.select_config.hasOwnProperty(category_id)) {
            this.select_config[category_id].items.forEach(function (item, index) {
                if (item.id == item_id) {
                    item_index = index;
                }
            });
        }
        return item_index;
    }
    //helpers
    emptyCategory(category_id) {
        delete this.select_config[category_id];
    }
    addCategory(category_info) {
        if (!this.select_config.hasOwnProperty(category_info.id)) {
            this.select_config[category_info.id] = {
                info: category_info,
                items: [
                    //..items
                ],
            };
        }
    }
}
