# Báo cáo phân tích APK — Noti (com.piggi.noti) v4.2.2

Ngày phân tích: 2026-10-28
Nguồn: `Noti+-+Mua+sắm+thông+minh_4.2.2_APKPure.xapk`

## 1. Thông tin gói

| Trường | Giá trị |
|---|---|
| Package | `com.piggi.noti` |
| Tên hiển thị | Noti (Nô Tì) |
| Phiên bản | 4.2.2 (versionCode 116) |
| minSdk / targetSdk | 24 / 36 |
| Nhà phát triển | piggi.vn |
| EAS project ID | `283453ff-50a8-46c5-872d-e116ea805ec5` |
| Kích thước XAPK | 122.8 MB (3 APK: base 93.9MB + arm64_v8a 28.8MB + en 70KB) |

**Kiến trúc:** React Native / Expo SDK 55, **Hermes bytecode**, New Architecture (Fabric/TurboModules) bật.
→ Chỉ có 20 class Java gốc; **toàn bộ logic nghiệp vụ nằm trong `assets/index.android.bundle` (18.5MB Hermes bytecode)**.

## 2. Công nghệ sử dụng

- **UI/Framework:** React Native 0.8x (new arch), Expo Router, Reanimated, NativeWind (Tailwind)
- **API layer:** Apollo Client 3 (GraphQL) + `graphql-tag`
- **Storage:** MMKV, AsyncStorage, Expo SecureStore
- **Push:** Firebase Cloud Messaging + Expo Notifications
- **OTA update:** RevoPush Code Push (`@revopush/react-native-code-push`)
- **Auth bên thứ ba:** Facebook SDK, Google Sign-In, Apple Sign-In
- **Analytics:** Firebase Analytics, Facebook App Events, App Check

## 3. Backend / endpoints

| Loại | Endpoint | Ghi chú |
|---|---|---|
| **GraphQL API** | `https://api.piggi.vn/graphql` | Toàn bộ dữ liệu chính |
| **CodePush OTA** | `https://cp.piggi.vn/` | Kênh cập nhật JS bundle |
| **CDN ảnh** | `https://images.piggi.vn` | |
| **Web app** | `https://noti.sale` | Deep link `applinks:noti.sale` |
| **Socket.IO** | qua `/engine.io`, path `/socket` | Chat realtime |

### 3.1 GraphQL — 102 operation khôi phục được

**File đầy đủ:** `decompiled/base/resources/assets/graphql_ops_clean.json` (30KB, 102 document).

Nhóm nghiệp vụ chính:
- **Auth:** `Me`, `GetMeNotificationPrefs`, `LoginDevices`, `auth/*` (`get_otp`, `verify_otp`, `login`, `logout-device`, `renew_password`, `update_password`)
- **Feed/Nội dung:** `GetFollowingPosts`, `GetFeaturedPosts`, `GetSuggestedPosts`, `GetSocialPosts`, `GetOnePost`, `GetPostDetail`, `SearchPosts`, `GetStories`, `GetCategories`
- **Chat:** `GetChatGroups`, `GetChatGroup`, `GetChatMessages`, `GetChatUnreadCount`
- **Thông báo:** `GetNotifications`, `GetNotificationDetail`, `GetNotificationConfig`, `MarkNotificationAsRead`, `MarkAllNotificationsAsRead`, `DeleteNotification`
- **Loyalty/Ví:** `LoyaltyWallets`, `LoyaltyWalletDetail`, `LoyaltyBrands`, `LoyaltyProducts`, `LoyaltyTimeline`, `WalletList`
- **Điểm/Referral:** `MeCoin`, `PointMissions`, `Ranks`, `BrandRewardCoins`, `ReferralInfo`, `ReferralProgress`, `ReferralStatistic`, `ReferredUsers`
- **Voucher:** `GetVouchers`, `GetVoucherCategories`, `GetVoucherItems`, `FlashSale`
- **Địa chỉ:** `Provinces`, `ProvincesNew`, `Districts`, `Wards`, `WardsNew`
- **Khác:** `GetAppVersion` (force-update), `UrboxPlusMembership`, `MiniApp`, `OnboardingSurvey`

**6 mutation** tìm thấy: `DeleteNotification`, `MarkAllNotificationsAsRead`, `MarkNotificationAsRead` (+ 3 tên bị cắt do minify).

### 3.2 REST endpoints (ngoài GraphQL)

```
/api/deal/view
/api/link/generate-link-normal
/api/shopee/generate-short-link
/api/v2/push/updateDeviceToken
```

### 3.3 Custom headers

`x-device-id`, `x-device-model`, `x-device-name`, `x-app-version`

## 4. Thông tin cấu hình thu thập được

| Mục | Giá trị |
|---|---|
| Firebase Project | `noti-6071d` |
| Google App ID | `1:518652036528:android:61d802b41265ea9c7fc275` |
| GCM Sender ID | `518652036528` |
| Facebook App ID | `1358320669239866` |
| Facebook Client Token | `f4e416d80a52babb47fe36432efb12d5` |
| Google OAuth Client (iOS) | `553325548800-cv37ta6hca0uud9t4jvn6i3tq8jcj5jc` |
| Google OAuth Client (2nd) | `553325548800-2ejuiee2ik4mp34434h68qso6iljjklk` |
| CodePush Deployment Key (Android) | `swlQfOfMxmn1iNxXokVYN0UUmHNR4ksvOXqog` |
| CodePush Server | `https://cp.piggi.vn/` |

## 5. Native module tùy chỉnh (Java/Kotlin)

Chỉ 2 module do app tự viết, còn lại là thư viện Expo/RN:

### `FloatingClock` (`com.piggi.noti.floatingclock`)
- Vẽ đồng hồ nổi trên màn hình bằng `SYSTEM_ALERT_WINDOW` overlay
- `FloatingClockService` (foreground service) + `FloatingClockView`

### `DealNotificationControls` (`com.piggi.noti.dealnotificationcontrols`)
- Kiểm soát hiển thị thông báo khuyến mãi (deal)
- Logic: `DealNotificationControlsPolicy.decide()`
  - Lọc theo `data["type"] == "SOCIAL"` → nếu không phải deal thì passthrough
  - Chế độ `SILENT` → chặn hẳn
  - Có `muteUntil` → chặn đến thời điểm đó
  - `importantOnly` → chỉ cho qua nếu `data["isImportant"] == "true"`
- Lưu config vào SharedPreferences (`DealNotificationControlsStorage`)

## 6. Quyền nguy hiểm đáng chú ý

- `SYSTEM_ALERT_WINDOW` — vẽ overlay lên app khác (dùng cho FloatingClock)
- `FOREGROUND_SERVICE_SPECIAL_USE` — chạy nền không giới hạn
- `DETECT_SCREEN_CAPTURE` — phát hiện khi bị chụp màn hình
- `READ_MEDIA_VISUAL_USER_SELECTED`, `WRITE_EXTERNAL_STORAGE`
- Nhiều quyền badge của launcher bên thứ ba (Samsung/HTC/Sony/Huawei/Oppo)

## 7. Cấu trúc file output

```
RE_app/
├── Noti+-+...xapk                          # 122.8 MB gốc
├── extracted/
│   ├── com.piggi.noti.apk                  # base APK 93.9 MB
│   ├── config.arm64_v8a.apk                # native libs 28.8 MB
│   ├── config.en.apk                       # resources 70 KB
│   └── manifest.json                       # XAPK metadata
├── decompiled/
│   ├── base/
│   │   ├── sources/                        # 15,614 file .java
│   │   └── resources/
│   │       ├── AndroidManifest.xml
│   │       ├── res/values/strings.xml
│   │       └── assets/
│   │           ├── index.android.bundle     # 18.5 MB Hermes bytecode
│   │           ├── app.config               # Expo config (JSON)
│   │           ├── graphql_ops_clean.json   # 102 GraphQL docs khôi phục
│   │           └── ...
│   └── config.en/
└── jadx-base.log
```

## 8. Hạn chế của phân tích

- Bundle là **Hermes bytecode**, chưa decompile ra JS. Để lấy logic đầy đủ cần `hermes-dec` hoặc `hbctool`. Hiện mới trích xuất được **string table** (chứa toàn bộ GraphQL document, URL, tên route, thông báo lỗi).
- 6 mutation bị minify tên nên chỉ nhận diện được 3.
- Không tìm thấy access/refresh token key rõ ràng — token lưu qua SecureStore với key động.
