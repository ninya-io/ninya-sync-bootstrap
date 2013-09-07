
SELECT "user"->'top_tags'
FROM   users
WHERE  '{"ruby-on-rails"}'::text[] <@ (json_val_arr("user"->'top_tags','tag_name')) OR
'{"jquery"}'::text[] <@ (json_val_arr("user"->'top_tags','tag_name'))