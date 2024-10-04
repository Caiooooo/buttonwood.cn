# [第一行代码]Jetpack篇——LiveData，Transformations无法导入
```kotlin
class MainViewModel(countReserved: Int) : ViewModel() {
private val userLiveData = MutableLiveData<User>()
val userName: LiveData<String> = Transformations.map(userLiveData) { user ->
	"${user.firstName} ${user.lastName}"
}
```

```kotlin
val userName: LiveData<String> = userLiveData.map { user ->
        "${user.firstName} ${user.lastName}"
    }
```

将上面这段改为下面就好。