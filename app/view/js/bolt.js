
// Don't break on browsers without console.log();
try { console.assert(1); } catch(e) { console = { log: function() {}, assert: function() {} } }

jQuery(function($) {

    // Any link (or clickable <i>-icon) with a class='confirm' gets a confirmation dialog..
    $('a.confirm').live('click', function(){
        return confirm( $(this).data('confirm') );
    });

    // Initialize the Fancybox shizzle.
    $('.fancybox').fancybox({ });

    // Helper to make things like '<button data-action="eventView.load()">' work
    $('button, input[type=button]').live('click', function(e){
        var action = $(this).data('action');
        if (typeof(action) != "undefined" && (action != "") ) {
            eval(action);
            e.preventDefault();
        }
    });

    // Show 'dropzone' for jQuery file uploader.
    // TODO: make it prettier, and distinguish between '.in' and '.hover'.
    $(document).bind('dragover', function (e) {
        var dropZone = $('.dropzone'),
            timeout = window.dropZoneTimeout;
        if (!timeout) {
            dropZone.addClass('in');
        } else {
            clearTimeout(timeout);
        }
        if (e.target === dropZone[0]) {
            dropZone.addClass('hover');
        } else {
            dropZone.removeClass('hover');
        }
        window.dropZoneTimeout = setTimeout(function () {
            window.dropZoneTimeout = null;
            dropZone.removeClass('in hover');
        }, 100);
    });

    // Add Date and Timepickers..
    $(".datepicker").datepicker({ dateFormat: "DD, d MM yy" });

    $.mask.definitions['2']='[0-2]';
    $.mask.definitions['5']='[0-5]';

    $(".timepicker").mask("29:59");

    // initialize 'moment' timestamps..
    if ($('.moment').is('*')) {
        updateMoments();
    }

    // Auto-update the 'latest activity' widget..
    if ($('#latestactivity').is('*')) {
        setTimeout( function(){ updateLatestActivity(); }, 20 * 1000);
    }

    // Hackish fix for an issue on Ipad, where dropdown menus wouldn't be clickable. Hopefully fixed in Bootstrap 2.1.2
    // See https://github.com/twitter/bootstrap/issues/2975
    $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });

    // Strictly speaking it's not allowed to use <a> inside a <button>, so Firefox ignores the
    // links in our dropdowns. Workaround:
    $('button.uselink').bind('click', function() {
        var link = $(this).find('a').attr('href');
        if (link != "") { window.location = link; }
    });

    // Initialize popovers.
    $('.info-pop').popover({
        trigger: 'hover',
        delay: { show: 500, hide: 200 }
    });

    // When hiding modal dialogs with a 'remote', remove the data, to make sure
    // other modal dialogs are forced to retrieve the content again.
    $('body').on('hidden', '.modal', function () {
        $(this).removeData('modal');
    });

    // Render any deferred widgets, if any.
    $('div.widget').each(function() {

        var key = $(this).data('key');

        $.ajax({
            url: asyncpath + 'widget/' + key,
            type: 'GET',
            success: function(result) {
                $('#widget-' + key).html(result)
            },
            error: function() {
                console.log('failed to get widget');
            }
        });

    });


});


/**
 * Initialise CKeditor instances.
 */
CKEDITOR.editorConfig = function( config ) {

    config.language = 'en';
    config.uiColor = '#DDDDDD';
    config.toolbar = [
        { name: 'styles', items: [ 'Format' ] },
        { name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike'  ] },
        { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', 'Indent', 'Outdent', '-', 'Blockquote' ] },

    ];

    if (wysiwyg.anchor) {
        config.toolbar = config.toolbar.concat({ name: 'links', items: [ 'Link', 'Unlink', '-', 'Anchor' ] });
    } else {
        config.toolbar = config.toolbar.concat({ name: 'links', items: [ 'Link', 'Unlink' ] });
    }

    if (wysiwyg.subsuper) {
        config.toolbar = config.toolbar.concat({ name: 'subsuper', items: [ 'Subscript', 'Superscript' ] });
    }
    if (wysiwyg.images) {
        config.toolbar = config.toolbar.concat({ name: 'image', items: [ 'Image' ] });
    }
    if (wysiwyg.tables) {
        config.toolbar = config.toolbar.concat({ name: 'table', items: [ 'Table' ] });
    }
    if (wysiwyg.align) {
        config.toolbar = config.toolbar.concat({ name: 'align', items: [ 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock' ] });
    }
    if (wysiwyg.fontcolor) {
        config.toolbar = config.toolbar.concat({ name: 'colors', items: [ 'TextColor', 'BGColor' ] });
    }

    config.toolbar = config.toolbar.concat({ name: 'tools', items: [ 'SpecialChar', '-', 'RemoveFormat', 'Maximize', '-', 'Source' ] });

    config.height = "250px";
    config.removePlugins = 'elementspath';
    config.resize_dir = 'vertical';
};




/**
 *
 * Initialize 'moment' timestamps..
 *
 */
function updateMoments() {

    $('time.moment').each(function(){
        var stamp = moment($(this).attr('datetime'));
        $(this).html( stamp.fromNow() );
    });
    clearTimeout(momentstimeout);
    momentstimeout = setTimeout( function(){ updateMoments(); }, 16 * 1000);

}

var momentstimeout;

/**
 *
 * Auto-update the 'latest activity' widget..
 *
 */
function updateLatestActivity() {

    $.get(asyncpath+'latestactivity', function(data) {
        $('#latesttemp').html(data);
        updateMoments();
        $('#latestactivity').html( $('#latesttemp').html() );
    });

    setTimeout( function(){ updateLatestActivity(); }, 30 * 1000);

}


/**
 *
 * Bind the file upload when editing content, so it works and stuff
 *
 */
function bindFileUpload(key) {

    // Since jQuery File Upload's 'paramName' option seems to be ignored,
    // it requires the name of the upload input to be "images[]". Which clashes
    // with the non-fancy fallback, so we hackishly set it here. :-/
    $('#fileupload-' + key).attr('name', 'files[]')
        .fileupload({
            dataType: 'json',
            dropZone: $('#dropzone-' + key),
            done: function (e, data) {
                $.each(data.result, function (index, file) {
                    var filename = decodeURI(file.url).replace("/files/", "");
                    $('#field-' + key).val(filename);
                    $('#thumbnail-' + key).html("<img src='" + path + "../thumbs/120x120c/"+encodeURI(filename)+"' width='120' height='120'>");
                    $('#progress-' + key + ' div.bar').css('width', "100%");
                    $('#progress-' + key).removeClass('progress-striped active');
                    window.setTimeout(function(){ $('#progress-' + key).fadeOut('slow'); }, 3000);
                });
            }
        })
        .bind('fileuploadprogress', function (e, data) {
            var progress = Math.round(100 * data._bitrateTimer.loaded / data.files[0].size);
            $('#progress-' + key).show().addClass('progress-striped active');
            $('#progress-' + key + ' div.bar').css('width', progress+"%");
        });


}


/**
 *
 * Functions for working with the automagic URI/Slug generation.
 *
 */
function makeUri(contenttypeslug, id, usesfield, slugfield, fulluri) {

    $('#'+usesfield).bind('propertychange input', function() {
        var field = $('#'+usesfield).val();
        clearTimeout(makeuritimeout);
        makeuritimeout = setTimeout( function(){ makeUriAjax(field, contenttypeslug, id, usesfield, slugfield, fulluri); }, 200);
    }).trigger('input');

}

function stopMakeUri(usesfield) {

    $('#'+usesfield).unbind('propertychange input');

}

var makeuritimeout;

function makeUriAjax(field, contenttypeslug, id, usesfield, slugfield, fulluri) {
    $.ajax({
        url: asyncpath + 'makeuri',
        type: 'GET',
        data: { title: field, contenttypeslug: contenttypeslug, id: id, fulluri: fulluri },
        success: function(uri) {
            $('#'+slugfield).val(uri);
            $('#show-'+slugfield).html(uri);
        },
        error: function() {
            console.log('failed to get an URI');
        }
    });
}


/**
 *
 * Making the 'video embed' filetype work.
 *
 */
function bindVideoEmbed(key) {

    $('#video-'+key).bind('propertychange input', function() {
        clearTimeout(videoembedtimeout);
        videoembedtimeout = setTimeout( function(){ bindVideoEmbedAjax(key); }, 400);
    });

    $('#video-'+key+'-width').bind('propertychange input', function() {
        if ($('#video-'+key+'-ratio').val() > 0 ) {
            $('#video-'+key+'-height').val( Math.round($('#video-'+key+'-width').val() / $('#video-'+key+'-ratio').val()) );
        }
    });

    $('#video-'+key+'-height').bind('propertychange input', function() {
        if ($('#video-'+key+'-ratio').val() > 0 ) {
            $('#video-'+key+'-width').val( Math.round($('#video-'+key+'-height').val() * $('#video-'+key+'-ratio').val()) );
        }
    });


}

var videoembedtimeout;

function bindVideoEmbedAjax(key) {

    // oembed endpoint http://api.embed.ly/1/oembed?format=json&callback=:callbackurl=
    // TODO: make less dependant on key..
    var endpoint = "http://api.embed.ly/1/oembed?format=json&key=51fa004148ad4d05b115940be9dd3c7e&url=";
    var url = endpoint + encodeURI($('#video-'+key).val());

    console.log('url', url);

    $.getJSON(url, function(data) {
        console.log(data);
        if (data.html) {
            $('#video-'+key+'-html').val(data.html);
            $('#video-'+key+'-width').val(data.width);
            $('#video-'+key+'-height').val(data.height);
            $('#video-'+key+'-ratio').val(data.width / data.height);
            $('#video-'+key+'-text').html('"' + data.title + '" by ' + data.author_name);
            $('#myModal').find('.modal-body').html(data.html);
            $('#video-'+key+'-author_name').val(data.author_name);
            $('#video-'+key+'-author_url').val(data.author_url);
            $('#video-'+key+'-title').val(data.title);
        }

        if (data.thumbnail_url) {
            $('#thumbnail-'+key).html("<img src='" + data.thumbnail_url + "' width='160' height='120'>");
            $('#video-'+key+'-thumbnail').val(data.thumbnail_url);
        }

    });

}


function bindGeolocation(key, latitude, longitude) {

    latitude = parseFloat(latitude);
    longitude = parseFloat(longitude);

    // Default location is Two Kings, for now.
    if (latitude == 0 || isNaN(latitude)) { latitude = 52.08184; }
    if (longitude == 0 || isNaN(longitude)) { longitude = 4.292368; }

    $("#" + key + "-address").bind('propertychange input', function() {
        clearTimeout(geotimeout);
        geotimeout = setTimeout( function(){ bindGeoAjax(key); }, 800);
    });

    $("#map-"+key).goMap({
        latitude: latitude,
        longitude: longitude,
        zoom: 15,
        maptype: 'ROADMAP',
        disableDoubleClickZoom: true,
        addMarker: false,
        icon: apppath + 'view/img/pin_red.png',
        markers: [{
            latitude: latitude,
            longitude: longitude,
            id: 'pinmarker',
            title: 'Pin',
            draggable: true
        }]
    });

    // Handler for when the marker is dropped..
    $.goMap.createListener({type:'marker', marker:'pinmarker'}, 'mouseup', function() { updateGeoCoords(key) });

}

var geotimeout;

function bindGeoAjax(key) {

    $.goMap.setMap({ address: $("#" + key + "-address").val() });
    $.goMap.setMarker('pinmarker', { address: $("#" + key + "-address").val() });

    setTimeout( function(){ updateGeoCoords(key); }, 500);

}

function updateGeoCoords(key) {
    var markers = $.goMap.getMarkers();
    var marker = markers[0].split(",");

    if (typeof(marker[0] != "undefined")) {
        $('#' + key + '-latitude').val( marker[0] );
        $('#' + key + '-longitude').val( marker[1] );

        // update the 'according to Google' info:
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(marker[0], marker[1]);
        geocoder.geocode({ 'latLng': latlng }, function(results, status) {
            $('#' + key + '-reversegeo').html(results[0].formatted_address);
            $('#' + key + '-formatted_address').val(results[0].formatted_address);
            // console.log(results);
        });

    }

};



function bindMarkdown(key) {
// return pasted.replace(/\d+/,"XXX"); }
    $('#'+key).catchpaste( function( pasted, options ) {

        $.ajax({
            url: asyncpath + 'markdownify',
            type: 'POST',
            data: { html: pasted },
            success: function(data) {
                $('#'+key).val(data);
            },
            error: function() {
                console.log('failed to get an URI');
                $('#'+key).val(pasted);
            }
        });
        return "";

    });

}


/**
 * Model, Collection and View for Imagelist.
 */
var Imagemodel = Backbone.Model.extend({
    defaults: {
        id: null,
        filename: null,
        title: "Untitled image",
        order: 1
    },
    initialize: function() {
    }
});

var Imagelist = Backbone.Collection.extend({
    model: Imagemodel,
    comparator: function(image) {
        return image.get('order');
    },
    setOrder: function(id, order, title) {
        _.each(this.models, function(item) {
            if (item.get('id')==id) {
                item.set('order', order);
                item.set('title', title);
            }
        });
    }
});

var ImagelistHolder = Backbone.View.extend({

    initialize: function(id) {
        this.list = new Imagelist();
        this.id = id;
        var prelist = $.parseJSON($('#'+this.id).val());
        _.each(prelist, function(item){
            var image = new Imagemodel({filename: item.filename, title: item.title, id: this.list.length });
            this.list.add(image);
        }, this);
        this.render();
        this.bindEvents();
    },

    addExisting: function() {
        var filename = prompt('Filename of image to add?');
        var title = prompt('Description of the image?');
        var image = new Imagemodel({filename: filename, title: title, id: this.list.length});
        this.list.add(image);
        this.render();
    },

    render: function() {
        this.list.sort();
        $('.imagelistholder .list').html('');
        _.each(this.list.models, function(image){
            var html = "<div data-id='" + image.get('id') + "' class='ui-state-default'>" +
                "<img src='" + path + "../thumbs/60x40/" + image.get('filename') + "' width=60 height=40><input type='text' value='" +
                _.escape(image.get('title'))  + "'><a href='#'><i class='icon-remove'></i></a></div>";
            $('.imagelistholder .list').append(html);
        });
        if (this.list.models.length == 0) {
            $('.imagelistholder .list').append("<p>No images in the list, yet.</p>");
        }
        this.serialize();
    },

    add: function(filename, title) {
        var image = new Imagemodel({filename: filename, title: title, id: this.list.length });
        this.list.add(image);
        this.render();
    },

    remove: function(id) {
        _.each(this.list.models, function(item) {
            if (item.get('id') == id) {
                this.list.remove(item);
            }
        }, this);
        this.render();
    },

    serialize: function() {
        var ser = JSON.stringify(this.list);
        $('#'+this.id).val(ser);
    },

    doneSort: function() {
        var list = this.list; // jQuery's .each overwrites 'this' scope, set it here..
        $('#imagelist-'+this.id+' .list div').each(function(index) {
            var id = $(this).data('id');
            var title = $(this).find('input').val()
            list.setOrder(id, index, title);
        });
        this.render();
    },

    bindEvents: function() {

        $(".imagelistholder div.list").sortable({
            stop: function() {
                imagelist.doneSort();
            },
            delay: 100,
            distance: 5
        });

        $('#fileupload-' + this.id).attr('name', 'files[]')
            .fileupload({
                dataType: 'json',
                dropZone: $('#imagelist-' + this.id),
                done: function (e, data) {
                    $.each(data.result, function (index, file) {
                        var filename = decodeURI(file.url).replace("/files/", "");
                        imagelist.add(filename, filename);
                    });
                }
            });

        $(".imagelistholder div.list a").live('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to remove this image?')) {
                var id = $(this).parent().data('id');
                imagelist.remove(id);
            }
        });

        $(".imagelistholder div.list input").live('blur', function() {
            imagelist.doneSort();
        });

    }

});
