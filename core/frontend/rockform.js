/**
 * Rockform - Simple, flexible ajax webform.
 * @author Rock'n'code
 * @version 4.4.0
 */

;
(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'jquery.form.min', 'jquery.mask.min', 'jquery.rtooltip', 'jquery.rmodal'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }
}(function($) {

    var baseform = window.baseform || {};
    baseform = (function() {

        function baseform(element, settings) {
            var _ = this,
                element = element || '',
                settings = settings || {};

            _.defaults = {
                config: '',
                path: '/rockform/init.php',
                timer: 2000,
                fields: {},
                submit_selector: '[type="submit"], [type="image"], [type="button"]',
                before_send_form: function(form) {},
                after_send_form: function(form) {},
                before_show_modal: function() {},
                after_show_modal: function() {},
                close_modal: function() {}
            };

            _.options = $.extend({}, _.defaults, settings);

            _.init(element, settings);
        }

        return baseform;
    }());

    baseform.prototype.fileupload = function(creation) {
        var _ = this;

        //Стилизация загружаемого файла
        $(document).on('change', '.bf-input-file', function(e) {

            var $input = $(this),
                $label = $input.next('label'),
                labelVal = $label.html();
            var fileName = '';

            if (this.files && this.files.length > 1) {
                fileName = (this.getAttribute('data-multiple-caption') || '').replace('{count}', this.files.length);
            } else if (e.target.value) {
                fileName = e.target.value.split('\\').pop();
            }

            if (fileName) {
                $label.find('span').html(fileName);
            } else {
                $label.html(labelVal);
            }
        });

    };

    baseform.prototype.capcha = function(creation) {
        var _ = this;

        //Отслеживание создания капчи для динамически вставленных форм
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || '';

        if (MutationObserver.length > 0) {
            var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

            var callback = function(allmutations) {
                    allmutations.map(function(mr) {
                        var jq = $(mr.addedNodes);
                        jq.find('img[data-bf-capcha]').click();
                    });
                },
                mo = new MutationObserver(callback),
                options = {
                    'childList': true,
                    'subtree': true
                };
            mo.observe(document, options);
        }

        var capcha = {
            init: function() {
                capcha.update();
                $(document)
                    .off("click", 'img[data-bf-capcha]')
                    .on("click", 'img[data-bf-capcha]', function() {
                        capcha.update();
                    });
            },
            update: function() {
                $('img[data-bf-capcha]').attr('src', _.options.path + '?type=capcha&u=' + Math.random());
            }
        };

        capcha.init();
    };

    baseform.prototype.mask_fields = function(creation) {

        var _ = this;

        var mask_pattern = '',
            mask_placeholder = {};

        var mask_fields = {
            init: function() {

                $(document).on('focus', '[data-bf-mask]', function() {
                    mask_fields.set($(this));
                });

                $('[data-bf-mask]').each(function() {
                    mask_fields.set($(this));
                });
            },
            set: function(el) {
                mask_pattern = el.data('bf-mask');
                mask_placeholder = el.attr('placeholder');

                if (mask_pattern.length > 0) {

                    if (typeof mask_placeholder == 'undefined' || mask_placeholder.length < 1) {
                        mask_placeholder = mask_pattern.replace(/[a-z0-9]+?/gi, "_");
                    }

                    mask_placeholder = { placeholder: mask_placeholder };

                    el.mask(mask_pattern, mask_placeholder);
                }
            }
        }

        mask_fields.init();

    };

    baseform.prototype.validation = function(form, data) {
        var _ = this;
        var validation = {

            init: function(form, data) {

                var err_msg,
                    el;
                valid = 0,
                    data = data || {};

                $('.bf-tooltip').rtooltip('reset');

                if (data.mail_to) {

                    $(_.options.submit_selector, form).rtooltip({ 'msg': data.mail_to });
                    return false;
                }

                if (data.filesize) {

                    $(_.options.submit_selector, form).rtooltip({ 'msg': data.filesize });
                    return false;
                }

                $.each(data, function(name, value) {
                    err_msg = '';

                    if (name == 'token') {
                        //устанавливаем токен в форму
                        _.set_attr_form(form, 'bf-token', data.token);
                    } else if (name == 'filesize') {

                    } else {

                        err_msg = validation.set_err_msg(value);
                        el = $('[name="' + name + '"]', form);

                        el.rtooltip({ 'msg': err_msg });

                        if (err_msg.length > 0) {
                            valid = +1;
                        }
                    }
                });

                if (parseInt(valid) > 0) {
                    return false;
                } else {
                    return true;
                }
            },
            set_err_msg: function(err) {
                var err_msg = '';
                if (err.required) {
                    err_msg = err.required;
                } else {
                    if (err.rangelength) {
                        err_msg = err.rangelength;
                    } else if (err.minlength) {
                        err_msg = err.minlength;
                    } else if (err.maxlength) {
                        err_msg = err.maxlength;
                    } else {
                        $.each(err, function(name, msg) {
                            if (
                                name == 'required' ||
                                name == 'rangelength' ||
                                name == 'minlength' ||
                                name == 'maxlength'
                            ) {

                            } else {
                                err_msg = msg;
                                return false;
                            }
                        });
                    }
                }

                return err_msg;
            }
        }
        return validation.init(form, data);
    };

    baseform.prototype.set_attr_form = function(form, name, value) {
        form.prepend('<input name="' + name + '" class="bf-attr" type="hidden" value="' + value + '" />');
    };

    baseform.prototype.init = function(el, settings) {

        var _ = this;

        var bf = {

            init: function(el, settings) {
                _.capcha();
                _.mask_fields();

                var init_custom = '',
                    form_el = '',
                    modal_el = '';

                if (el.length > 0) {
                    init_custom = el;
                    form_el = 'form' + el + ',form[data-delegate="' + el + '"]';
                } else {
                    form_el = 'form[data-bf]';
                }

                bf.set_form(form_el);

                if (el.length > 0) {
                    modal_el = el + ':not(form)'
                } else {
                    modal_el = '[data-bf]:not(form)';
                }

                var modal_options = {
                    config: _.options.config,
                    timer: _.options.timer,
                    fields: _.options.fields
                }

                $.rmodal(modal_el, {
                    path: _.options.path,
                    params: modal_options,
                    before: function(this_el, params) {
                        //очищаем тултипы
                        $('.bf-tooltip').rtooltip('reset');

                        //получаем дата-атрибуты с элемента
                        data = this_el.data('bf') || '';
                        if (typeof data === 'string') {
                            if (data.length > 0) {
                                data = { 'config': data };
                            }
                        }

                        //передаём дополнительные поля к форме отправки
                        var custom_fields = bf.get_custom_fields(this_el);
                        //проверяем если есть поля переданные в вызове конфига
                        data.fields = data.fields || {};
                        data.fields = $.extend({}, data.fields, custom_fields);

                        params = $.extend({}, params, data);

                        var attributes = {
                            'data': params.fields,
                            'bf-config': params.config,
                            'timer': params.timer,
                            'config': params.config,
                            'type': 'form'
                        }

                        return attributes;
                    },
                    after: function(this_el, wrap_form, params) {
                        //передаём в новую форму параметры с кнопки

                        var option = {};
                        option.fields = params.data || {};
                        option.timer = params.timer || {};
                        option.config = params.config || {};

                        var data = JSON.stringify(option);

                        if (init_custom.length > 0) {
                            wrap_form.find('form').attr('data-delegate', init_custom);
                        } else {
                            wrap_form.find('form').attr('data-bf', data);
                        }

                    }
                });
            },
            set_form: function(el, params) {

                params = params || _.options;

                $(document).off('submit', el)
                    .on('submit', el, params, function(e) {
                        e.preventDefault();
                        var form = $(this);

                        $('.bf-tooltip').rtooltip('reset');

                        //получаем дата-атрибуты с элемента
                        data = form.data('bf') || '';
                        if (typeof data === 'string') {
                            if (data.length > 0) {
                                data = { 'config': data };
                            }
                        }

                        _.options = $.extend({}, _.options, e.data, data);

                        //сериализуем форму
                        var formdata = form.formToArray();
                        var filesize = [];

                        //заменяем объект файла именем файла
                        $.each(formdata, function(index, element) {
                            if (element.type == 'file') {
                                formdata[index].size = element.value.size || '';
                                formdata[index].value = element.value.name || '';

                                //вычисляем размер файлов для загрузки
                                filesize.push(formdata[index].size);
                            }
                        });

                        //серверная валидация
                        $.post(
                            _.options.path, {
                                'fields': formdata,
                                'type': 'validation',
                                'bf-config': _.options.config,
                                'filesize': filesize
                            },
                            function(response) {

                                response = response || {};
                                //отправка формы, если валидация прошла
                                if (_.validation(form, response)) {

                                    _.set_attr_form(form, 'bf-config', _.options.config);

                                    //добавляем дополнительные параметры в форму из всплывающего окна
                                    $.each(_.options.fields, function(name_item, value_item) {
                                        _.set_attr_form(form, 'bf[fields][' + name_item + ']', value_item);
                                    });


                                    form.ajaxSubmit({
                                        beforeSubmit: function(arr, form, options) {
                                            //событие перед отправкой формы
                                            _.options.before_send_form(form);
                                            $(_.options.submit_selector, form).prop('disabled', true);
                                        },
                                        url: _.options.path,
                                        type: 'post',
                                        dataType: 'json',
                                        success: bf.show_response,
                                        error: function(jqXHR, textStatus, errorThrown) {
                                            alert('Server: ' + textStatus);
                                        }
                                    });

                                }
                                $('.bf-attr').remove();
                            });
                    });
            },
            get_custom_fields: function(el) {

                var attributes = {};
                var attr_el = '';

                if (el.length) {
                    $.each(el[0].attributes, function(index, attr) {
                        attr_el = attr.name;
                        if (/data\-bf\-field/.test(attr_el)) {
                            attr_el = attr_el.replace(/data\-bf\-field(\-|_)/, '');
                            attributes[attr_el] = attr.value;
                        }
                    });
                }

                attributes['page_h1'] = $('h1:first').text() || '';
                attributes['page_url'] = document.location.href;

                return attributes;

            },
            show_response: function(response, statusText, xhr, form) {

                var focused = $(_.options.submit_selector, form);
                focused.prop('disabled', false).removeAttr("disabled");


                if (parseInt(response.status) > 0) {

                    //событие после успешной отправки формы
                    _.options.after_send_form(form);

                    //выводим окно об успешной отправке
                    $.post(
                        _.options.path, {
                            'type': 'form_success',
                            'bf-config': response['bf-config']
                        },

                        function(content) {
                            form.hide();

                            form.after(content);

                            //закрываем окно всплывающее
                            setTimeout(
                                function() {
                                    $.rmodal('reset');
                                }, _.options.timer
                            );

                            //сбрасываем состояние встроенной формы
                            setTimeout(
                                function() {
                                    form.show();
                                    form.clearForm();
                                    $('[data-bf-success]').remove();
                                }, (_.options.timer + 1000)
                            );
                        },
                        'html'
                    );

                } else {
                    focused.rtooltip({ 'msg': response.value });
                }
            }
        }
        bf.init(el, settings);
    };

    $.bf = function(el) {
        var _ = this,
            opt = arguments[1] || {};
        new baseform(el, opt);
        return _;
    };

    new baseform();

}));