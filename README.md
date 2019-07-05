# SolrSearch

SolrSearch is a simple, one NodeJs file application which acts as a dumb
front end to an Apache Solr instance. Specifically, it is able to front Solr
when Solr is used to index large amounts of on-filesystem documentation, also
exposed to the web. However, SolrSearch can be used for plenty of other
applications as well!

## Getting Started

### Prerequisites

SolrSearch assumes you have NodeJs installed as well as a configured Apache Solr
instance with a collection you would like to search.

### Installing

First, clone down SolrSearch:

```
git clone https://github.com/Ichbinjoe/solrsearch.git && cd solrsearch
```

Run npm install:

```
npm i
```

Copy over the configuration (then configure for your environment):

```
cp config.json.example config.json
```

Then, start the SolrSearch server with node:

```
node index.js
```

### Creating an index for SolrSearch

You can index files on your filesystem using the
[bin/post](https://lucene.apache.org/solr/guide/7_5/post-tool.html) tool. If
your files are indexed this way, SolrSearch will have no problems serving
searches from collections created.

### Configuration Values

This section describes some of the various configuration values:

+ `query`: This is the query that SolrSearch will send to the Solr instance.
  The `{{rows}}` and `{{start}}` substitution should be used so that SolrSearch
  can properly paginate the results. `{{query}}` will be replaced with the
  user's query.
+ `page_size`: This is the number of queries to return on each page.
+ `replace.regex`: For each result SolrSearch receives, it will apply this
  regex to figure out the document path to replace
+ `replace.with`: For each result, this is the text that is replaced by the
  regex. Usually, these two options are to rewrite a file location from a local
  file to a network accessible file uri
+ `pagination_steps`: This is the number of available page number options are
  available at the bottom of the page. This should be odd for best UI
+ `pagination_bubble`: This is the number of available page number options which
  should always be surrounding the current page
+ `base`: This is the base url path of this search instance. Should be / if
  querying SolrSearch directly.

### Re-theming the search page

The search page can be modified by modifying the template
`views/search.handlebars` and `views/layouts/main.handlebars`.

### Offline Use

As of now, SolrSearch can work completely without any Internet connection,
except for a connection to the Solr instance.

## Contributing

I'm very gracious for any pull requests people may have! Please send them over.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
