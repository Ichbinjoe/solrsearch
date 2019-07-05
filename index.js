const express = require('express');
const http = require('http');
const path = require('path');

function get_config() {
    const fs = require('fs');
    if (!fs.existsSync('config.json'))
        fs.copyFileSync('config.json.example', 'config.json')
    return require('config.json')
}

const config = get_config();

const app = express();

app.engine('handlebars', require('express-handlebars')());
app.set('view engine', 'handlebars');

const query_regex = /\{\{query\}\}/
const rows_regex = /\{\{rows\}\}/
const start_regex = /\{\{start\}\}/

const result_replacer = new RegExp(config.replace.regex)

function render_result(q, res, data) {
    const tmpl = {q, base: config.base}
    
    const {numFound, start, docs} = data.response
    const page_size = config.page_size;
    const pages = Math.ceil(numFound / page_size);

    tmpl.results = []
    for (const doc of docs) {
        const title = (doc.title && doc.title.length > 0 && doc.title[0]) || doc.id.replace(result_replacer, "")
        tmpl.results.push({
            url: doc.id.replace(result_replacer, config.replace.with),
            title
        })
    }

    if (numFound <= 0)
	tmpl.no_results = true

    // Lets first figure out if we need pagination
    if (numFound > page_size) {
        tmpl.pagination = true
        // This math should always be pretty smooth, but you know.
        const total_pages = Math.floor(numFound / page_size) + 1
        const page_on = Math.floor(start / page_size) + 1

        if (page_on <= 1)
            tmpl.no_prev = true
        else
            tmpl.prev_link = `${config.base}/?q=${q}&p=${page_on-1}`

        if (page_on >= total_pages)
            tmpl.no_next = true
        else
            tmpl.next_link = `${config.base}/?q=${q}&p=${page_on+1}`

        tmpl.page = []
        if (total_pages < config.pagination_steps) {
            // This version is easy - just list out the numbers
            for (let i = 1; i <= total_pages; i++) {
                tmpl.page.push({
                    disabled: i == page_on,
                    link: (i != page_on && `${config.base}/?q=${q}&p=${i}`) || '#',
                    text: i.toLocaleString()
                })
            }
        } else {
            // Time for some fancy math!
            // We always display the first and the last pages, with dots as
            // separators
            if (page_on < config.pagination_steps - (config.pagination_bubble + 1)) {
                // Number is within the first set, no first ... needed
                for (let i = 1; i <= config.pagination_steps - 2; i++) {
                    tmpl.page.push({
                        disabled: i == page_on,
                        link: (i != page_on && `${config.base}/?q=${q}&p=${i}`) || '#',
                        text: i.toLocaleString()
                    })
                }
                tmpl.page.push({
                    disabled: true,
                    link: '#',
                    text: '...'
                })
                tmpl.page.push({
                    disabled: false,
                    link: `${config.base}/?q=${q}&p=${total_pages}`,
                    text: total_pages.toLocaleString()
                })
            } else if (page_on > total_pages - config.pagination_steps + (config.pagination_bubble + 1)) {
                tmpl.page.push({
                    disabled: false,
                    link: `${config.base}/?q=${q}&p=1`,
                    text: 1
                })
                
                tmpl.page.push({
                    disabled: true,
                    link: '#',
                    text: '...'
                })
                
                for (let i = total_pages - config.pagination_steps + 2; 
                    i <= total_pages; i++) {
                    tmpl.page.push({
                        disabled: i == page_on,
                        link: (i != page_on && `${config.base}/?q=${q}&p=${i}`) || '#',
                        text: i.toLocaleString()
                    })
                }
            } else {
                // Yay we need both!
                tmpl.page.push({
                    disabled: false,
                    link: `${config.base}/?q=${q}&p=1`,
                    text: 1
                })
                
                tmpl.page.push({
                    disabled: true,
                    link: '#',
                    text: '...'
                })

                const siding = (config.pagination_steps - 4) / 2
                for (let i = page_on - Math.floor(siding); 
                    i <= page_on + Math.floor(siding); i++) {
                    tmpl.page.push({
                        disabled: i == page_on,
                        link: (i != page_on && `${config.base}/?q=${q}&p=${i}`) || '#',
                        text: i.toLocaleString()
                    })
                }
                
                tmpl.page.push({
                    disabled: true,
                    link: '#',
                    text: '...'
                })
                tmpl.page.push({
                    disabled: false,
                    link: `${config.base}/?q=${q}&p=${total_pages}`,
                    text: total_pages.toLocaleString()
                })
            }
        }
    }
    
    res.render('search', tmpl)
}

app.get(config.base, (req, res) => {
    if (req.query.q) {
        // OH BOY WE HAVE SOME SEARCHING TO DO
        const page_size = config.page_size
        let start_result = 0 
        if (req.query.p) {
            let page = parseInt(req.query.p)
            if (isNaN(page))
                page = 1
            start_result = page_size * (page - 1)
            if (start_result < 0)
                start_result = 0
        }

        let qstr = config.query

        // So this should aready be encoded, but better safe than sorry!
        const query_esc = encodeURIComponent(req.query.q);

        const query = qstr.replace(query_regex, query_esc)
            .replace(rows_regex, page_size)
            .replace(start_regex, start_result)

        http.get(query, (hres) => {
            if (hres.statusCode !== 200)
            {
                hres.resume();
                return res.status().send(res.statusCode);
            }

            let raw_data = '';
            hres.on('data', (chunk) => { raw_data += chunk });
            hres.on('end', () => {
                try {
                    const data = JSON.parse(raw_data);
                    return render_result(req.query.q, res, data)
                } catch (e) {
                    res.status(500).send();
                }
            })
        })
    } else {
        res.render('search', {base: config.base, pagination: false, results: []})
    }
})

const bootstrap_path = path.join(__dirname, 'node_modules/bootstrap/dist')

app.use(config.base, express.static(bootstrap_path))

app.listen(3000, 'localhost');
