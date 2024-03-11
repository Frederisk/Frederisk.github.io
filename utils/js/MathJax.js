(function(){
    var config = `
    MathJax.Hub.Config({
      extensions: ["tex2jax.js"],
      jax: ["input/TeX", "output/HTML-CSS"],
      tex2jax: {
        inlineMath: [ ['$','$'], ["\\(","\\)"] ],
        displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
        processEscapes: true
      },
      "HTML-CSS": { availableFonts: ["TeX"] }
    });
    `;
    var configScript = document.createElement('script');
    configScript.type = 'text/x-mathjax-config';
    configScript.text = config;
    document.head.appendChild(configScript);

    var MathJaxUrl = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?';
    var mathJaxScript = document.createElement("script");
    mathJaxScript.type = "text/javascript";
    mathJaxScript.src = MathJaxUrl;
    document.head.appendChild(mathJaxScript);
})();
