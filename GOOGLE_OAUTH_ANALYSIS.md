# Google OAuth Analysis — com.piggi.noti (Noti) v4.2.2

Ngày: 2026-10-28 | APK: `Noti+-+Mua+sắm+thông+minh_4.2.2_APKPure.xapk`

## Kết luận nhanh (TL;DR)

| Câu hỏi | Trả lời |
|---|---|
| **Client ID** | `553325548800-cv37ta6hca0uud9t4jvn6i3tq8jcj5jc` |
| **Redirect URI** | `com.googleusercontent.apps.553325548800-cv37ta6hca0uud9t4jvn6i3tq8jcj5jc:/oauth2redirect` |
| **Platform** | **iOS** (đăng ký trong `CFBundleURLSchemes` của `app.config`), không có intent-filter tương ứng trên Android |
| **Dùng được cho browser flow?** | **KHÔNG** (native-only) |
| **Có Client ID thứ 2** | `553325548800-2ejuiee2ik4mp34434h68qso6iljjklk` — cùng project, nhiều khả năng là iOS bundle ID `com.piggivn.noti` |

> ⚠️ **Đính chính báo cáo trước:** số đúng là `553325548800` (**12 chữ số**). Bản trước ghi `55332548800` (11 chữ số) — sai 1 ký tự.

---

## 1. Redirect URI

Không tìm thấy chuỗi `oauth2redirect`, `redirect_uri`, `/callback` **ở bất kỳ đâu** trong APK:

| Nguồn | `oauth2redirect` | `redirect_uri` | `com.googleusercontent.apps.` |
|---|---|---|---|
| `AndroidManifest.xml` | 0 | 0 | 0 |
| `res/values/strings.xml` | 0 | 0 | 0 |
| `res/values/*.xml` (toàn bộ) | 0 | 0 | 0 |
| Java sources (15,614 file) | 0 | 0 | 0 |
| Hermes bundle (string table) | 0 | 0 | 0 |

Redirect URI **suy ra từ chính Client ID** theo quy ước của Google (reversed client ID scheme):

```
com.googleusercontent.apps.553325548800-cv37ta6hca0uud9t4jvn6i3tq8jcj5jc:/oauth2redirect
```

Chuỗi này **không xuất hiện trong APK** — nó được OS/Google SDK/AppAuth ghép runtime từ custom scheme. Việc APK không chứa literal này là bình thường.

## 2. Client ID được dùng ở đâu

### Nguồn duy nhất khai báo: `assets/app.config`

```json
{
  "ios": {
    "infoPlist": {
      "CFBundleURLTypes": [
        { "CFBundleURLSchemes": ["noti"] },
        { "CFBundleURLSchemes": [
            "com.googleusercontent.apps.553325548800-cv37ta6hca0uud9t4jvn6i3tq8jcj5jc"
        ]}
      ]
    }
  },
  "android": { "package": "com.piggi.noti" }
}
```

**Đây là khối `ios.infoPlist` → scheme chỉ đăng ký cho iOS.** Khối `android` **không** chứa `com.googleusercontent.apps.*`.

### Trong Hermes bundle (2 occurrence, đều là string table)

| Offset | Chuỗi | Vai trò |
|---|---|---|
| 2024949 | `553325548800-2ejuiee2ik4mp34434h68qso6iljjklk.apps.googleusercontent.com` | client #2 |
| 2428267 | `553325548800-cv37ta6hca0uud9t4jvn6i3tq8jcj5jc.apps.googleusercontent.com` | client #1 |

Không có URL redirect nào xung quanh hai chuỗi này — chúng nằm trong string table lẫn giữa dữ liệu SVG/font, không phải object config cạnh nhau.

### Thư viện đăng nhập Google có trong APK

- **Native:** `com.reactnativegooglesignin` (`@react-native-google-signin/google-signin`) — 13 class Java
- **Native Google Play Services:** `com.google.android.gms.auth.api.signin` + `...auth.api.identity`
- **Không có:** `firebase-auth` (chỉ có `firebase-common`, analytics, messaging, appcheck, installations)

### Cách SDK nhận Client ID — `RNGoogleSigninModule.configure()`

`com/reactnativegooglesignin/RNGoogleSigninModule.java:110`:

```java
String string = readableMap.hasKey("webClientId")
        ? readableMap.getString("webClientId") : null;
```

→ Client ID được truyền **từ JS xuống runtime**, không hardcode trong native. Trong bundle có key `webClientId` (1 lần) và `iosClientId` (1 lần) ⇒ app truyền Client ID động từ JS.

`Utils.getSignInOptions()` (`Utils.java`):

```java
GoogleSignInOptions.Builder b = new GoogleSignInOptions.Builder(DEFAULT_SIGN_IN)
        .requestScopes(new Scope("email"), scopeArr);
if (str != null && !str.isEmpty()) {
    b.requestIdToken(str);              // str = webClientId
    if (z) b.requestServerAuthCode(str, z2);   // offlineAccess
}
```

Đây là **luồng Android native**: `requestIdToken(webClientId)` → trả `idToken` cho backend xác thực. Không liên quan browser.

### Không có whitelist nhiều Client ID

Chỉ 2 Client ID xuất hiện trong toàn APK, **cùng project number `553325548800`**:
- `cv37ta6hca0uud9t4jvn6i3tq8jcj5jc`
- `2ejuiee2ik4mp34434h68qso6iljjklk`

Không tìm thấy mảng/list Client ID nào trong code.

## 3. AndroidManifest.xml

### Không có intent-filter cho Google OAuth

Quét toàn bộ `<intent-filter>` bằng XML parser — các scheme duy nhất:

| Scheme | Host | Dùng cho |
|---|---|---|
| `https` (trong `<queries>`) | — | package visibility |
| `noti` | — | deep link app |
| `https` | `noti.sale` | App Links (`autoVerify=true`) |
| `@string/fb_login_protocol_scheme` = `fb1358320669239866` | — | Facebook Login |
| `fbconnect` | `cct.com.piggi.noti` | Facebook Custom Tab |

**Không có** `com.googleusercontent.apps.*` — đây là điểm quyết định: **Android build không đăng ký OAuth redirect scheme**.

Cũng **không có** `<meta-data android:name="com.google.android.gms.auth.api.signin.clientid">`.

Các meta-data GMS hiện có đều là boilerplate:
```
com.google.android.gms.version
com.google.android.gms.auth.api.signin.internal.SignInHubActivity  (activity, exported=false)
com.google.android.gms.auth.api.signin.RevocationBoundService      (service)
```

`SignInHubActivity` là activity nội bộ của Play Services dùng cho native sign-in dialog — **không phải** browser redirect receiver.

## 4. google-services.json / tương đương

`google-services.json` **không được đóng gói dạng thô** — Gradle plugin đã biên dịch thành `res/values/strings.xml`:

| Resource | Giá trị |
|---|---|
| `project_id` | `noti-6071d` |
| `google_app_id` | `1:518652036528:android:61d802b41265ea9c7fc275` |
| `gcm_defaultSenderId` | `518652036528` |
| `google_api_key` | `AIzaSyB0J6swDghAc5wBEPBIMYWlCy4x-wVIJMg` |
| `google_crash_reporting_api_key` | `AIzaSyB0J6swDghAc5wBEPBIMYWlCy4x-wVIJMg` |
| `google_storage_bucket` | `noti-6071d.appspot.com` |
| `default_web_client_id` | **KHÔNG TỒN TẠI** |

### Điểm mâu thuẫn đáng chú ý

| Nguồn | Project number |
|---|---|
| Firebase (`google_app_id`) | `518652036528` |
| OAuth Client IDs | `553325548800` |

**Hai project number khác nhau.** Client ID OAuth nằm ở project Google Cloud **khác** với Firebase project `noti-6071d`. Điều này giải thích vì sao `default_web_client_id` không có — resource đó chỉ được sinh khi có OAuth client kiểu "Web application" trong cùng project Firebase.

Ngoài ra `google_api_key` bị **trùng lặp** giữa `google_api_key` và `google_crash_reporting_api_key` (cùng giá trị) — dấu hiệu cấu hình tay, không chuẩn.

### `oauth_client` section

Không thể liệt kê đầy đủ vì `google-services.json` gốc không có trong APK. Suy ra từ artifacts:

| client_id | Platform suy đoán | Căn cứ |
|---|---|---|
| `553325548800-cv37ta6hca0uud9t4jvn6i3tq8jcj5jc` | iOS | Duy nhất trong `ios.infoPlist.CFBundleURLSchemes` |
| `553325548800-2ejuiee2ik4mp34434h68qso6iljjklk` | iOS (bundle thứ 2) | Cùng project, có trong bundle JS nhưng không có scheme |
| `518652036528-...` (Android) | Android | Suy ra từ `google_app_id`, nhưng **không tìm thấy client ID Android OAuth** dạng `*.apps.googleusercontent.com` |

**Không có** Client ID loại "Web application" (`default_web_client_id` vắng mặt) ⇒ **không có OAuth client phục vụ browser flow.**

## 5. Hermes bundle — có redirect URL gần Client ID không?

Không. Kiểm tra cả 2 chiều:

```
oauth2redirect        : 0
:/oauth2              : 0
redirect_uri          : 0
redirectUri           : 0
accounts.google.com   : 0
oauth2/v2/auth        : 0
oauth2.googleapis.com : 0
response_type=code    : 0
client_secret         : 0
expo-auth-session     : 0
WebBrowser.           : 0
```

Context ±350 byte quanh mỗi Client ID chỉ có: dữ liệu SVG path, tên font (`ab_serif`), permission Android, icon name. **Không có URL, không có object config OAuth.**

Dấu hiệu browser flow duy nhất là `openAuthSessionAsync` (1 lần) — nhưng nằm lẫn trong string table cạnh `arrow_menu_open`, không gần bất kỳ Client ID hay URL Google nào. Khả năng cao đây là string của `expo-web-browser` được bundle vào dù không dùng cho Google OAuth (app có nhiều luồng login: OTP, Facebook, Google, Apple).

## 6. Tổng hợp: Client ID dùng được cho browser flow không?

### ❌ KHÔNG — lý do

1. **Scheme `com.googleusercontent.apps.*` không có trong AndroidManifest** → Android không thể nhận redirect qua custom scheme này. Browser OAuth trên Android sẽ fail ngay ở bước callback.
2. **`default_web_client_id` không tồn tại** → không có OAuth client loại "Web application" để làm `client_id` cho flow `response_type=code`.
3. **Không có `client_secret`, không có `accounts.google.com`, không có `oauth2/v2/auth`** trong toàn bộ APK → app chưa bao giờ mở browser flow tới Google.
4. **Client ID đăng ký trong khối `ios.infoPlist`** → thiết kế cho iOS native app.
5. **`redirect_uri` là custom scheme** (`com.googleusercontent.apps...:/oauth2redirect`). Với client loại "iOS", Google **chỉ** chấp nhận đúng redirect URI này — không thể đổi sang `https://`. Về lý thuyết browser vẫn mở được URL authorize và redirect về `com.googleusercontent.apps...:/oauth2redirect?code=...`, nhưng **chỉ app đã cài trên máy đó mới nhận được scheme này**; một ứng dụng web của bên thứ ba không thể bắt được `code`. Ngoài ra dùng client ID loại installed-app từ server/web bị Google coi là sai kiểu client → dễ bị chặn/`redirect_uri_mismatch`.
6. **Luồng thực tế là `requestIdToken(webClientId)`** — Android native Sign-In trả `idToken` JWT cho backend `api.piggi.vn/graphql`, backend verify chữ ký. Không có browser nào tham gia.

### Kết luận cuối

| Trường | Giá trị |
|---|---|
| **Client ID** | `553325548800-cv37ta6hca0uud9t4jvn6i3tq8jcj5jc` |
| **Client ID #2** | `553325548800-2ejuiee2ik4mp34434h68qso6iljjklk` |
| **Redirect URI** | `com.googleusercontent.apps.553325548800-cv37ta6hca0uud9t4jvn6i3tq8jcj5jc:/oauth2redirect` |
| **Platform** | **iOS** (custom scheme chỉ đăng ký trong `ios.infoPlist`) |
| **Browser-based OAuth?** | **No** |
| **Cơ chế thực tế** | Android native Google Sign-In (`@react-native-google-signin`) → `idToken` → GraphQL backend |

### Nếu muốn dùng cho browser flow (không khuyến khích)

Sẽ **fail** vì Google kiểm tra `redirect_uri` khớp registered URI. Custom scheme `com.googleusercontent.apps.*` chỉ hợp lệ cho iOS/Android client, không hợp lệ cho web client. Muốn browser flow cần:
- Một OAuth client loại **Web application** với redirect `https://...` (không có trong APK)
- Google sẽ trả `redirect_uri_mismatch` (Error 400) nếu dùng client ID iOS với redirect `https://`

---

## Phụ lục: Ma trận bằng chứng

| Artifact | iOS client | Android client | Web client |
|---|---|---|---|
| `app.config` → `ios.infoPlist.CFBundleURLSchemes` | ✅ có | — | — |
| `AndroidManifest` → `<intent-filter>` scheme | — | ❌ không | — |
| `default_web_client_id` resource | — | — | ❌ không |
| `google-services.json` thô | ❌ không đóng gói | ❌ | ❌ |
| Hermes bundle string table | ✅ 2 ID | ❌ | ❌ |
| `RNGoogleSigninModule.configure(webClientId)` | ✅ runtime | ✅ runtime | — |
| `requestIdToken()` | — | ✅ | — |
| `requestServerAuthCode()` | — | ✅ (offlineAccess) | — |
| `client_secret` trong APK | — | — | ❌ không |
| `accounts.google.com` | — | — | ❌ không |
