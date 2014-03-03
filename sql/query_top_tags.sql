SELECT * FROM users WHERE 
	(
	'layout' in (Select value->>'tag_name' FROM json_array_elements("user"->'top_tags')) OR 
	'android' in (Select value->>'tag_name' FROM json_array_elements("user"->'top_tags'))
	) 
	AND 
	(
	"user"->>'location' LIKE '%Germany%' OR 
	"user"->>'location' LIKE '%WI%'
	)