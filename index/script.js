
(function(document) {
	'use strict';

    /**
     * Support for document ready
     */
    function documentReady(fn) {
        if (document.readyState != 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    /** 
     * Underscore string's titleize.
     */ 
    function titleize(str) {
        return decodeURI(str).toLowerCase().replace(/(?:^|\s|-)\S/g, c => c.toUpperCase());
    }
    
    /**
     * Set the title and build breadcrumb according to
     * current location.
     */
    function setTitle() {
        let cleanPath       = window.location.pathname.replace(/\/$/g, ''),
            titleText, 
            breadcrumbHtml  = '', 
            index           = 0, 
            origin          = window.location.origin + '/';
        
        if (cleanPath) {
            let parts = cleanPath.split('/');
            cleanPath = parts[parts.length - 1];
            titleText = titleize(cleanPath).replace(/-|_/g, ' ');

            breadcrumbHtml += '<a href="' + origin + '">Home</a><span class="separator">/</span>'
            parts.forEach((name) => {
                if (name){
                    origin += name + '/';
                    breadcrumbHtml += '<a ';

                    if (index == parts.length -1){
                        breadcrumbHtml += 'class="active" ';
                    }
                    breadcrumbHtml += 'href="' + origin + '">' + name + '</a><span class="separator">/</span>'
                }
                index++;
            });
        } else {
            titleText = window.location.host;
        }

        titleText = `Index of ${titleText}`;

        const titleContainer = document.querySelector('h1#title');
        const breadContainer = document.querySelector('div#breadcrumb');

        if (titleContainer) titleContainer.innerHTML = titleText;
        if (breadContainer) breadContainer.innerHTML = breadcrumbHtml;
        document.title = titleText;
    }

    /**
     * Add sort icon according to query search.
     * Use ▴ for ascending and ▾ for descending
     * @see https://ux.stackexchange.com/questions/37564/use-up-or-down-arrow-to-represent-sort-ascending-at-table-header
     */
    function setSortIcon(){
        let args = window.location.search;
        let sortIcon = '▴';
        let column = document.querySelector('th.indexcolname');

        if (args.includes('O=D')) sortIcon = '▾';
        if (args.includes('C=M')) column = document.querySelector('th.indexcollastmod');
        if (args.includes('C=S')) column = document.querySelector('th.indexcolsize');
        if (args.includes('C=D')) column = document.querySelector('th.indexcoldesc');
        if (column){
            column.innerHTML = column.innerHTML + '<span class="sorticon">' + sortIcon + '</span>';
        }
    }

    /**
     * Handle search input change.
     */
    function onSearchInputChange(e) {

        let input       = e.target,
            closeButton = document.querySelector('.close-search'),
            hidden      = 0,
            matchs      = 0,
            val         = input.value.toLowerCase(),
            rowNoItem   = document.querySelector('table#indexlist tBody tr.no-items');

        if (!rowNoItem){
            let row = document.createElement('tr');
            row.classList.add('no-items');
            row.innerHTML = '<td colspan="5">No matching items</td>';
            document.querySelector('table#indexlist tBody').appendChild(row);
            rowNoItem = row;
        }
        if (val.length == 0){
            cleanSearch();
            return;
        }

        document.querySelectorAll('table#indexlist tBody tr').forEach(row => {
            if (row.classList.contains('indexbreakrow') || row.classList.contains('indexhead')) {
                return;
            } 

            let text = row.textContent.toLowerCase();
            if (text.indexOf(val) === -1 || row.classList.contains('even-parentdir')) {
                row.classList.add('hidden');
                hidden++;
            } else {
                row.classList.remove('hidden');
                matchs++;
            }
        });

        closeButton.classList.toggle('active', val.length > 0)
        rowNoItem.classList.toggle('hidden', matchs > 0)

    }

    /**
     * Clean search and restore filtered elements.
     */
    function cleanSearch() {
        document.querySelectorAll('table#indexlist tBody tr').forEach(element => {
            if (element.classList.contains('no-items')){
                element.classList.add('hidden');
            } else {
                element.classList.remove('hidden');
            }
        });
        document.querySelector('.close-search').classList.remove('active');
        document.querySelector('input#filter').value = '';
        document.querySelector('input#filter').focus();
    }
	

    let imageDescriptions = {};
    async function fetchDescriptions() {
        try {
            let response = await fetch('descriptions.json');
			
            if (response.ok) {
                imageDescriptions = await response.json();
            }
        } catch (error) {
        }
    }
    function getDescription(filename) {
        return imageDescriptions[filename] || 'Image'; // Default description if not found
    }

	async function showImage() {
		await fetchDescriptions();
		 
		document.querySelectorAll('a').forEach(function(link) {
			if (!link.getAttribute("href").match("/$")) {
				let href = link.getAttribute('href');
				if (href && href.match(/\.(JPEG|JPG|jpeg|jpg|gif|png)$/) !== null) {
					if (!link.querySelector('img')) { // Check if an image already exists
						let thumbnailHref = href.replace(/([^\/]+)$/, '.thumbnails/$1');
						let img = document.createElement('img');
						img.src = thumbnailHref;
						img.alt = link.textContent || 'Image';
						link.textContent = '';
						let description = getDescription(href); // Get the description
						link.appendChild(img);
						
						// Find the corresponding indexcoldesc <td> element and add the description
						let parentRow = link.closest('tr');
						if (parentRow) {
							let descTd = parentRow.querySelector('td.indexcoldesc');
							if (descTd) {
								descTd.textContent = description;
							}
						}
					}
				}
			}
		});
	}

    /**
     * Start
     */
    documentReady(function(){
        setTitle();
        setSortIcon();
		showImage();
        document.querySelector('input#filter').addEventListener('input', onSearchInputChange);
        document.querySelector('.close-search').addEventListener('click', cleanSearch);
    });

})(document);
