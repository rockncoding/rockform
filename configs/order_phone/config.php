<?php defined("BASE_FORM_PATH") or die("Access denied"); ?>
[config]

; Почта получателей. Можно несколько через запятую.
; mail_to = 

; Заголовок письма.
mail_subject = 'Заказ звонка'

[validation]

phone = required,minlength[18]
rule = required 