# C#是低階語言嗎？

我是 [Fabien Sanglard](http://fabiensanglard.net/) 所做一切的忠實粉絲，我喜歡他的部落格並且從頭到尾讀了他的[兩本](http://fabiensanglard.net/gebbdoom/index.html)[著作](http://fabiensanglard.net/gebbwolf3d/index.html)（對於他的書的更多資訊，可以參考最近的 [Hansleminutes podcast](https://hanselminutes.com/666/episode-666-game-engine-black-book-doom-with-fabien-sanglard)）。

在最近，他寫了一篇精彩的文章，在其中他[破譯了一張明信片大小的光線追蹤器](http://fabiensanglard.net/postcard_pathtracer/index.html)，解開了其中受混淆的程式碼並且對其涉及的數學原理給出了精彩的解釋。我真心推薦你們花點時間去讀一下！

不過，這也讓我開始思考，**有無將 C++ 程式碼移植至 C# 的可能？**

其中一部分的原因是由於我的[日常工作](https://raygun.com/platform/apm)，我不得不編寫大量的 C++，並且我發現我開始有點生疏了，所以我想這樣做可能對我有所助益！

不過更為重要的是，我想更深入地去瞭解 **C# 是低階語言嗎？**

一個略有差異但有所相關的問題是「C#適合『系統程式設計』嗎？」對於有關此的更多內容我強烈推薦看看 Joe Duffy [在 2013 年發表的優秀文章](http://joeduffyblog.com/2013/12/27/csharp-for-systems-programming/)。

## 逐行移植

我開始將[反混淆的 C++ 程式碼](http://fabiensanglard.net/postcard_pathtracer/formatted_full.html)逐行移植為 [C#](https://gist.github.com/mattwarren/d17a0c356bd6fdb9f596bee6b9a5e63c)。而事實證明這非常簡單直接，我甚至在想說畢竟 C# 是 C++++ 的故事是真的！！

來看一個例子，程式中主要的資料結構是「vector」，把程式碼像這樣放在一起，左邊是 C++，右邊是 C#：

![對比 C++ 與 C# 的 struct Vec](./assets/Diff-Cpp-v-CSharp-struct-Vec.png)

語法差異當然是有的，不過由於 .NET 容許你自行定義自己的「實值型別」所以得到一樣的功能。這點很重要，將「vector」視為結構可以使其「資料區域性」更加優良，而且由於資料將進入堆疊而不需要涉及 .NET 的垃圾收集（大概如此，我知道這是個實現細節）。
