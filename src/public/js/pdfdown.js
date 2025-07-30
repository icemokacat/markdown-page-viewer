const downBtn = document.getElementById('pdfDownBtn');
const targetEle = document.querySelector("article");

const pdfdown = {

    init : function () {
        downBtn.addEventListener('click', () => {
            this.pdfDownload('test');
        });
    },

    pdfDownload : function (fileName) {
        const articleContent = document.querySelector("article").outerHTML;

        const styles = Array.from(document.styleSheets).reduce((acc, stylesheet) => {
            try {
              return acc + Array.from(stylesheet.cssRules)
                .reduce((css, rule) => css + rule.cssText, '');
            } catch (error) {
              return acc; // Skip cross-origin stylesheets
            }
          }, '');

        fetch('/download-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ html: articleContent,styles }),
          })
          .then(response => response.blob()) // Convert the response into a blob
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'article.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
          })
          .catch(error => console.error('Error downloading PDF:', error));
    }

}

document.addEventListener('DOMContentLoaded', function () {
    pdfdown.init();
});
