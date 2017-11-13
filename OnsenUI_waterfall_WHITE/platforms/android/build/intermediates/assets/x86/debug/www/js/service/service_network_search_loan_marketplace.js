/**
 * @service network_search_loan_marketplace
 * @desc this service provides the search function for loan marketplace,
 * and refreshes the list with new data.
 */
waterfall.service('network_search_loan_marketplace', ['network_api', 'service_alert', 'user_credentials', function (network_api, service_alert, user_credentials) {
        this.search_query = null;
        this.search_done = false;
        var that = this;

        this.URL_GET_PRODUCT = DEFAULT_SERVER_IP + '/NuwaterfallWebAPI/api/waterfall/GetProduct';
        this.URL_INVEST_PRODUCT = DEFAULT_SERVER_IP + '/NuwaterfallWebAPI/api/waterfall/InvestProduct';

        this.MESSAGE_STATUS_INSUFFICIENT_CREDIT = "100";

        this.MESSAGE_KEY_CATALOGUE_ID = 'CatalogueId';
        this.MESSAGE_VALUE_DEFAULT_CATALOGUE_ID = '1';
        this.MESSAGE_KEY_PRODUCT_RANK = 'ProductRank';
        this.MESSAGE_KEY_INVESTMENT_AMOUNT_FROM = 'InvestmentAmountFrom';
        this.MESSAGE_KEY_TENURE = 'Tenure';
        this.MESSAGE_KEY_START_INDEX = 'StartIndex';
        this.MESSAGE_KEY_RECORD_COUNT = 'RecordCount';

        this.MESSAGE_KEY_INVESTMENT_CURRENCY = 'InvestmentCurrency';
        this.MESSAGE_KEY_RETURN_CURRENCY = 'ReturnCurrency';


        this.MESSAGE_KEY_ROWINDEX = 'RowIndex';
        this.MESSAGE_KEY_TOTALROW = 'TotalRow';
        this.MESSAGE_KEY_PRODUCT_ID = 'ProductId';
        this.MESSAGE_KEY_PRODUCT_NAME = 'ProductName';
        this.MESSAGE_KEY_PRODUCT_SUBTITLE = 'ProductSubtitle';
        this.MESSAGE_KEY_PRODUCT_DESC = 'ProductDesc';
        this.MESSAGE_KEY_PRODUCT_IMAGE_URL = 'ProductImageURL';
        this.MESSAGE_KEY_INVESTMENT_CURRENCY = 'InvestmentCurrency';
        this.MESSAGE_KEY_INVESTMENT_AMOUNT = 'InvestmentAmount';
        this.MESSAGE_KEY_RETURN_CURRENCY = 'ReturnCurrency';
        this.MESSAGE_KEY_RETURN_AMOUNT = 'ReturnAmount';
        this.MESSAGE_KEY_TENURE_TYPE = 'TenureType';
        this.MESSAGE_KEY_PRODUCT_LIST = 'ProductList';


        this.search_query_default =
        {
            search_rating: '0',
            search_loan_amount: '100',
            search_term_integer: '30',
            search_term_unit_time: 'day'
        };

        this.NUM_TOTAL_ROW = 1;
        var alert_loading_dialog;
        /**
         * @function save_search
         * @desc save search parameters, to be used in loan_marketplace
         * @param search
         * the search object containing specific perameters.
         */
        this.save_search = function (search) {
            this.search_done = true;
            this.search_query = {};
            this.search_query.search_rating = search.rating;
            this.search_query.search_loan_amount = parseInt(Number(
                search.loan_amount.replace(/[^0-9\.]+/g, "")));
            this.search_query.search_term_integer = search.search_term_integer;
            this.search_query.search_term_unit_time = search.search_term_unit_time;
        };

        /**
         * @function invest_product
         * @desc submit investment to server, and ask for approval
         * if approved, we get to add the loan to our loan portfolio
         * @param product
         * the data of the specific loan..
         */
        this.invest_product = function (product) {
            var data = {};
            service_alert.create_alert(service_alert.ALERT_LOADING_API).then(function (dialog) {
                service_alert.alert_message = "Submitting Investment..";
                alert_loading_dialog = dialog;
                data[user_credentials.MESSAGE_KEY_INVESTOR_ID] = user_credentials.id;
                data[that.MESSAGE_KEY_INVESTMENT_CURRENCY] = product.investment_currency;
                data[that.MESSAGE_KEY_RETURN_CURRENCY] = product.return_currency;
                data[that.MESSAGE_KEY_INVESTMENT_AMOUNT] = product.investment;
                data[that.MESSAGE_KEY_RETURN_AMOUNT] = product.returns;
                data[that.MESSAGE_KEY_TENURE] = product.duration;
                data[that.MESSAGE_KEY_TENURE_TYPE] = product.duration_type;
                data[that.MESSAGE_KEY_PRODUCT_ID] = product.productid;
                network_api.ajax_call(that.URL_INVEST_PRODUCT, data, check_response);
            });

            function check_response(success) {
                alert_loading_dialog.hide();
                if (!success)
                    return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
                else if (isNull(arguments[3]))
                //invalid response. For now show a network error.
                    return service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK);
                var response = arguments[3];

                if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS) {
                    user_credentials.credit = response[user_credentials.MESSAGE_KEY_CREDIT_BALANCE];
                    DEFAULT_CURRENCY = response[user_credentials.MESSAGE_KEY_CREDIT_CURRENCY];
                    user_credentials.currency = response[user_credentials.MESSAGE_KEY_CREDIT_CURRENCY];
                    user_credentials.id = response[user_credentials.MESSAGE_KEY_INVESTOR_ID];
                    service_alert.create_alert(service_alert.ALERT_LOAN_MARKETPLACE_LOAN_DETAILS_INVEST_CONFIRM, false);
                }
                else if (response[network_api.MESSAGE_KEY_STATUS] == that.MESSAGE_STATUS_INSUFFICIENT_CREDIT)
                    service_alert.create_alert(service_alert.ALERT_INSUFFICIENT_CREDIT).then(
                        function (dialog) {
                            dialog.on('prehide', function () {
                            });
                        });
                else
                    service_alert.create_alert(service_alert.ALERT_ERROR_NETWORK).then(
                        function (dialog) {
                            dialog.on('prehide', function () {
                            });
                        });
            }
        };

        /**
         * @function submit_search
         * @desc perform the search for loan marketplace, and call the server for results
         * @param index_start
         * starting index of search
         * @param record_count
         * the maximum number of records to be returned from the server
         * @param scope
         * scope of controller, likely loan_marketplace controller
         * @param itemScope
         * the item object that was created by loan marketplace.
         */
        this.submit_search = function (index_start, record_count, scope, itemScope) {
            var data = {};
            var final_search_query = this.get_search();

            //preallocate slots for server response to populate rows in data storage.
            record_count = this.preallocate_itemScope_object_storage(index_start, record_count);
            //setup the current item to be of the index_start
            this.configureItemScope(index_start, itemScope);
            //if we are unable to preallocate ANY slots because they were already allocated through another submit_search call,
            //then return and skip this submit_search query
            if (!record_count)
                return;

            //populate our data object with the search query
            data[that.MESSAGE_KEY_CATALOGUE_ID] = this.MESSAGE_VALUE_DEFAULT_CATALOGUE_ID;
            data[that.MESSAGE_KEY_PRODUCT_RANK] = final_search_query.search_rating;
            data[that.MESSAGE_KEY_INVESTMENT_AMOUNT_FROM] = final_search_query.search_loan_amount.toString();
            data[that.MESSAGE_KEY_TENURE] = final_search_query.search_term_integer;
            data[that.MESSAGE_KEY_START_INDEX] = index_start.toString();
            data[that.MESSAGE_KEY_RECORD_COUNT] = record_count.toString();
            data[that.MESSAGE_KEY_TENURE_TYPE] = final_search_query.search_term_unit_time;
            //make a timed ajax call after 200ms, for stability in rendering and making api calls
            setTimeout(
                function () {
                    network_api.ajax_call(that.URL_GET_PRODUCT, data, check_response);
                }, 200);


            function check_response(success) {
                //show an error message if we did not manage to get server data.
                if (!success || isNull(arguments[3])) {
                    if (that.NUM_TOTAL_ROW == 1 && !isNull(that.itemScope_object_storage)) {
                        if (isNull(that.itemScope_object_storage["1"]))
                            return;
                        that.itemScope_object_storage["1"].error_message = 'Sorry, we could not connect.';
                        that.itemScope_object_storage["1"].error = true;
                        that.itemScope_object_storage["1"].loaded = true;
                        that.itemScope_object_storage["1"].desc = 'Please check your internet connection.';
                        scope_apply(scope);
                    }
                    return;
                }

                var response = arguments[3];

                if (response[network_api.MESSAGE_KEY_STATUS] == network_api.MESSAGE_STATUS_SUCCESS) {

                    if (that.NUM_TOTAL_ROW != response[that.MESSAGE_KEY_TOTALROW]) {
                        that.NUM_TOTAL_ROW = response[that.MESSAGE_KEY_TOTALROW];
                        scope_apply(scope);
                    }
                    //if your response was successful, process the results.
                    that.process_product_list(response[that.MESSAGE_KEY_PRODUCT_LIST]);

                }
                else {
                    if (that.NUM_TOTAL_ROW == 1) {
                        that.itemScope_object_storage["1"].error_message = 'No results found.';
                        that.itemScope_object_storage["1"].error = true;
                        that.itemScope_object_storage["1"].loaded = true;
                        that.itemScope_object_storage["1"].desc = 'Search returned: \n\nStatus: ' + response[network_api.MESSAGE_KEY_STATUS] + ' \n\nMessage: ' + response[network_api.MESSAGE_KEY_MESSAGE];
                    }
                    debug_log('network_search_loan_marketplace ALERT_ERROR_STATUS : ' + response[network_api.MESSAGE_KEY_STATUS] + ' - ' + response[network_api.MESSAGE_KEY_MESSAGE] + '|' +
                        JSON.stringify(that.itemScope_object_storage)
                    );
                }
                scope_apply(scope);
            }
        };

        /**
         * @function reset_marketplace_list
         * @desc reset the data objects that we use to keep our loan data.
         * usually when exiting loan marketplace, and moving to another screen.
         */
        this.reset_marketplace_list = function () {
            debug_log('reset_marketplace_list');
            this.itemScope_object_storage = {};
            this.NUM_TOTAL_ROW = 1;
            this.rating_template = $(".rating_template").rateYo(
                {
                    rating: 0,
                    halfStar: true,
                    disableMouse: true,
                    spacing: '10px',
                    starWidth: '10px'
                }
            );
        };

        /**
         * @function delete_marketplace_list_item
         * @desc delete an item from data storage.
         * usually because lazy-repeat list asks for it to be deleted.
         * @param index
         * index of the item
         */
        this.delete_marketplace_list_item = function (index) {
                delete this.itemScope_object_storage[index.toString()];
        };

        /**
         * @function preallocate_itemScope_object_storage
         * @desc allocate slots for the search query.
         * if slots have already been allocated, there is no need to do another search query
         * and waste bandwidth
         * @param index_start
         * starting index of query for server, and starting index of allocation
         * @param record_count
         * max number of records to allocated
         * @returns {new_record_count}
         * if our allocation overlaps another allocation already done because of another query,
         * we only allocate up to just before that other allocation, SUCH THAT THERE IS NO OVERLAP.
         * therefore, we get a record count of how much we actually allocated for this query.
         *
         * for example, if i request to allocated 10 slots, from index 0 to 10, but index 7 and onwards
         * already has an allocation, i only allocate from index 0 to index 6, and my new_record_count
         * is of value 7.
         */
        this.preallocate_itemScope_object_storage = function (index_start, record_count) {
            var new_record_count;
            for (new_record_count = 0; new_record_count < record_count; new_record_count++) {
                if (!((index_start + new_record_count).toString() in this.itemScope_object_storage)) {
                    var item_index = index_start + new_record_count - 1;

                    this.itemScope_object_storage[(index_start + new_record_count).toString()] =
                    {
                        index: item_index,
                        productid: '',
                        title: '',
                        label: '',
                        desc: '',
                        rating: 0,
                        rating_render: '',
                        imgsrc: '',
                        loaded: false,
                        error: false,
                        inview: false,
                        error_message: '',
                        investment: 0,
                        returns: 0,
                        investment_currency: '',
                        return_currency: '',
                        investment_formatted: 0,
                        return_formatted: 0,
                        duration: 0,
                        duration_type: ''
                    };
                }
                else
                    return new_record_count; // the new record count;
            }
            return new_record_count;
        };

        /**
         * @function process_product_list
         * @desc process the products (loans) that were returned from
         * the server, and put them into our data storage object
         * @param product_list_array
         * the array of products returned from server
         */
        this.process_product_list = function (product_list_array)
        {
            for (var i = 0; i < product_list_array.length; i++) {
                var server_item = product_list_array[i];
                var list_item = this.itemScope_object_storage[server_item[this.MESSAGE_KEY_ROWINDEX].toString()];

                if (isNull(list_item))
                    continue;

                list_item.investment_currency = server_item[this.MESSAGE_KEY_INVESTMENT_CURRENCY];
                list_item.return_currency = server_item[this.MESSAGE_KEY_RETURN_CURRENCY];
                var symbol_native = CURRENCY_LIST[list_item.return_currency]['symbol_native'];
                var symbol = CURRENCY_LIST[list_item.return_currency]['symbol'];
                var investment_currency = new Intl.NumberFormat([DEFAULT_LOCALE],
                    {
                        style: "currency",
                        currency: list_item.investment_currency,
                        currencyDisplay: "symbol",
                        maximumFractionDigits: 2
                    });

                var return_currency = new Intl.NumberFormat([DEFAULT_LOCALE],
                    {
                        style: "currency",
                        currency: list_item.return_currency,
                        currencyDisplay: "symbol",
                        maximumFractionDigits: 2
                    });

                list_item.loaded = true;
                list_item.error = false;
                list_item.index = server_item[this.MESSAGE_KEY_ROWINDEX] - 1;
                list_item.title = server_item[this.MESSAGE_KEY_PRODUCT_NAME];
                list_item.label = server_item[this.MESSAGE_KEY_PRODUCT_SUBTITLE];
                list_item.desc = server_item[this.MESSAGE_KEY_PRODUCT_DESC];
                list_item.productid = server_item[this.MESSAGE_KEY_PRODUCT_ID];

                list_item.imgsrc = server_item[this.MESSAGE_KEY_PRODUCT_IMAGE_URL];
                list_item.investment = server_item[this.MESSAGE_KEY_INVESTMENT_AMOUNT];
                list_item.returns = server_item[this.MESSAGE_KEY_RETURN_AMOUNT];
                list_item.investment_formatted = investment_currency.format(list_item.investment).replace(symbol, symbol_native);
                list_item.return_formatted = return_currency.format(list_item.returns).replace(symbol, symbol_native);
                list_item.duration_type = server_item[this.MESSAGE_KEY_TENURE_TYPE];
                list_item.duration = server_item[this.MESSAGE_KEY_TENURE];

                list_item.rating = server_item[this.MESSAGE_KEY_PRODUCT_RANK];
                this.rating_template.rateYo("rating", list_item.rating);
                list_item.rating_render = this.rating_template.clone().prop('outerHTML');
                scope_loan_marketplace.check_item_inview(list_item);
            }

        };

        /**
         * @function configureItemScope
         * @desc set the item to refer to our data storage, with a specific index in that storage
         * @param generated_index
         * the specified index
         * @param itemScope
         * the item scope
         */
        this.configureItemScope = function (generated_index, itemScope) {
            var server_index = generated_index;

            if (!(server_index.toString() in this.itemScope_object_storage))
                return;

            itemScope.item = this.itemScope_object_storage[server_index.toString()];

        };

        this.cancel_search = function () {
            this.search_done = false;
            this.search_query = null;
        };

        this.get_search = function () {
            if (!this.search_done)
                return this.search_query_default;
            return this.search_query;
        };

        this.issearchdone = function () {
            return this.search_done;
        };

        /**
         * @function check_items_inview
         * @desc check if item is within viewport of phone, and if we should render it
         * @param scope
         * the scope of the controller (loan marketplace, in this case)
         */
        this.check_items_inview = function (scope) {
            for (var property in  this.itemScope_object_storage) {
                scope_loan_marketplace.check_item_inview(
                    this.itemScope_object_storage[property]);
            }
            scope_apply(scope);
        };


    }
    ]
);