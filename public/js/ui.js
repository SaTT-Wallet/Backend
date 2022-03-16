$(document).ready(() => {
    var form = document.getElementById('inspect-form')
    var input = document.getElementById('url')
    var inspect = document.getElementById('')

    function onSubmit() {
        var url = input.value
        var query
        if (url.indexOf('https://www.facebook.com/') != -1) {
            query = '/facebook?url=' + url
        }
        if (url.indexOf('https://twitter.com/') != -1) {
            var parts = url.split('/')
            query = '/twitter/' + parts[3] + '/' + parts[5]
        }
        if (url.indexOf('https://www.instagram.com/') != -1) {
            var parts = url.split('/')
            query = '/instagram/' + parts[4]
        }
        if (url.indexOf('https://www.youtube.com/watch') != -1) {
            var parts = url.split('=')
            query = '/youtube/' + parts[1]
        }
        $.get(query, function (data) {
            $('#result').html(data)
        })
        return false
    }

    $('#inspect').on('click', onSubmit)
})
