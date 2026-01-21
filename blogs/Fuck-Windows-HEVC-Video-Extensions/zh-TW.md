# 去他媽的 HEVC 視訊延伸模組

貌似由於種種原因，或許是因為 HEVC 又在搞授權費用那一套。總之免費的[裝置製造商的 HEVC 視訊延伸模組](https://apps.microsoft.com/detail/9n4wgh0z6vhq)已經不可用，不然就當[花 1 美元](https://apps.microsoft.com/detail/9nmzlz57r3t7)的盤子，本著有免費為何浪費錢的原則所以收集到了該軟體下架前的 package，直接開啟安裝即可。

> 下載：[Microsoft.HEVCVideoExtension_2.1.1161.0_neutral_~_8wekyb3d8bbwe.AppxBundle](./assets/Microsoft.HEVCVideoExtension_2.1.1161.0_neutral_~_8wekyb3d8bbwe.AppxBundle)

對於 Windows Server 或者 CLI 環境，你可能需要使用 pwsh 命令：

```pwsh
Add-AppxPackage -Path 'PathOfAppx/HEVCVideoExtension.AppxBundle'
```

或者是 DISM：

```cmd
DISM /Online /Add-ProvisionedAppxPackage /PackagePath:"PathOfAppx/HEVCVideoExtension.AppxBundle" /SkipLicence
```
