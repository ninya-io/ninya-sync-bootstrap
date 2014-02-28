
/*

{
    "user": {
        "properties": {
            "location": {
                "type": "string"
            },
            "tags": {
                "type": "nested",
                "properties": {
                    "tag_name": {
                        "type": "string"
                    },
                    "score": {
                        "type": "integer"
                    }
                }
            }
        }
    }
}


//

{
  "query": {
    "bool" : {
        
        "should" : [
            {
                "wildcard" : { "location" : "han*" }
            },
            {
                "wildcard" : { "location" : "ber*" }
            }
        ],
        "minimum_should_match" : 1
    }
}
}

//

{
  "query": {
    "bool" : {
        
        "should" : [
            {
                "wildcard" : { "location" : "han*" }
            },
            {
                "wildcard" : { "location" : "ber*" }
            }
        ],
        "minimum_should_match" : 1
    }
  },
  "filter": {
    "bool" : {
        
        "should" : [
            {
                "term" : { "tags.tag_name" : "php" }
            },
           {
                "term" : { "tags.tag_name" : "angular" }
            }
        ]
    }
  }
}

//

{
    "query": {
        "bool": {
            "must": [
                {
                    "bool": {
                        "should": [
                            {
                                "wildcard": {
                                    "location": "han*"
                                }
                            },
                            {
                                "wildcard": {
                                    "location": "ber*"
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
                },
                {
                    "bool": {
                        "should": [
                            {
                                "wildcard": {
                                    "tags.tag_name": "ph*"
                                }
                            },
                            {
                                "wildcard": {
                                    "tags.tag_name": "ang*"
                                }
                            }
                        ]
                    }
                }
            ]
        }
    }
}


//
{
    "sort": [
        {
            "score": {
                "order": "desc",
                "mode": "sum",
                "nested_path": "tags",
                "nested_filter": {
                  "bool": {
                    "should": [
                      {
                        "prefix": {
                          "tag_name": "node"
                      }
                      },
                      {
                        "prefix": {
                          "tag_name": "ang"
                      }
                      }
                    ]
                  }
                }
            }
        }
    ],
    "query": {
        "bool": {
            "must": [
                {
                    "bool": {
                        "should": [
                            {
                                "wildcard": {
                                    "location": "han*"
                                }
                            },
                            {
                                "wildcard": {
                                    "location": "ber*"
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
                },
                {
                    "nested": {
                        "path": "tags",
                        "query": {
                            "bool": {
                                "should": [
                                    {
                                        "prefix": {
                                            "tags.tag_name": "ph"
                                        }
                                    },
                                    {
                                        "prefix": {
                                            "tags.tag_name": "ang"
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        }
    }
}
*/


// var doc1 = {
//   index: 'blog',
//   type: 'user',
//   id: 1,
//   body: {
//     location: 'Hannover',
//     tags: [
//       { tag_name: 'angular', score: 20000 },
//       { tag_name: 'nodejs', score: 500 } 
//     ]
//   }
// };

// var doc2 = {
//   index: 'blog',
//   type: 'user',
//   id: 2,
//   body: {
//     location: 'Berlin',
//     tags: [
//       { tag_name: 'php', score: 1000 },
//       { tag_name: 'nodejs', score: 5000 } 
//     ]
//   }
// };


// Q.all([
//   client.index(doc1),
//   client.index(doc2)
// ])
// .then(function(data){

//   console.log(data);
//   client.search({
//     index: 'blog',
//     type: 'post',
//     body: {
//       query: {
//         match: {
//             location: 'Ber*'
//           }
//       }
//     }
//   })
//   .then(function(response){
//     console.log('query');
//     console.log(response);
//     console.log('foo');
//   }, function(error){
//     console.log(error);
//   });
// });


