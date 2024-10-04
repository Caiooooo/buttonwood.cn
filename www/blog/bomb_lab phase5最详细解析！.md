
# bomb_lab phase5最详细解析！

## 1.先对反汇编代码进行初步美化

```assembly
phase5:  
  401062:	53                   	push   %rbx
  401063:	48 83 ec 20          	sub    $0x20,%rsp
  401067:	48 89 fb             	mov    %rdi,%rbx
  40106a:	64 48 8b 04 25 28 00 	mov    %fs:0x28,%rax
  401071:	00 00 
  401073:	48 89 44 24 18       	mov    %rax,0x18(%rsp)
  401078:	31 c0                	xor    %eax,%eax
  40107a:	e8 9c 02 00 00       	callq  40131b <string_length>
  40107f:	83 f8 06             	cmp    $0x6,%eax              //检测读入长度是否为6
  401082:	74 4e                	je     4010d2 <phase_5+0x70>
  401084:	e8 b1 03 00 00       	callq  40143a <explode_bomb>
  401089:	eb 47                	jmp    4010d2 <phase_5+0x70>
  //eax = 6char
  
real start:
  40108b:	0f b6 0c 03          	movzbl (%rbx,%rax,1),%ecx
  40108f:	88 0c 24             	mov    %cl,(%rsp)
  401092:	48 8b 14 24          	mov    (%rsp),%rdx
  401096:	83 e2 0f             	and    $0xf,%edx
  401099:	0f b6 92 b0 24 40 00 	movzbl 0x4024b0(%rdx),%edx    // maduiersnfotvby
  4010a0:	88 54 04 10          	mov    %dl,0x10(%rsp,%rax,1)
  4010b3:	be 5e 24 40 00       	mov    $0x40245e,%esi //flyers
  4010b8:	48 8d 7c 24 10       	lea    0x10(%rsp),%rdi
  4010bd:	e8 76 02 00 00       	callq  401338 <strings_not_equal>
  4010c2:	85 c0                	test   %eax,%eax
  4010c4:	74 13                	je     4010d9 <phase_5+0x77>  //work out
  4010c6:	e8 6f 03 00 00       	callq  40143a <explode_bomb>
  4010cb:	0f 1f 44 00 00       	nopl   0x0(%rax,%rax,1)
  4010d0:	eb 07                	jmp    4010d9 <phase_5+0x77>


end:
  4010d2:	b8 00 00 00 00       	mov    $0x0,%eax
  int eax = 0;
  4010d7:	eb b2                	jmp    40108b <phase_5+0x29>
  4010d9:	48 8b 44 24 18       	mov    0x18(%rsp),%rax
  4010de:	64 48 33 04 25 28 00 	xor    %fs:0x28,%rax
  4010e5:	00 00 
  4010e7:	74 05                	je     4010ee <phase_5+0x8c>
  4010e9:	e8 42 fa ff ff       	callq  400b30 <__stack_chk_fail@plt> // in case overflow
  
real_end:
  4010ee:	48 83 c4 20          	add    $0x20,%rsp
  4010f2:	5b                   	pop    %rbx
  4010f3:	c3                   	retq   
```

## 2.不难看出，真正需要我们解密的部分在realstart部分，realstart前面是检测读入字符串长度是否等于六

接下来我们看realstart 可以分为两部分 第一部分处理字符串 第二部分检查所得是否于0x40245e

```assembly
real start:

part1:
  40108b:	0f b6 0c 03          	movzbl (%rbx,%rax,1),%ecx
  40108f:	88 0c 24             	mov    %cl,(%rsp)
  401092:	48 8b 14 24          	mov    (%rsp),%rdx
  401096:	83 e2 0f             	and    $0xf,%edx
  401099:	0f b6 92 b0 24 40 00 	movzbl 0x4024b0(%rdx),%edx    // maduiersnfotvby
  4010a0:	88 54 04 10          	mov    %dl,0x10(%rsp,%rax,1)

part2:
  4010b3:	be 5e 24 40 00       	mov    $0x40245e,%esi //flyers
  4010b8:	48 8d 7c 24 10       	lea    0x10(%rsp),%rdi
  4010bd:	e8 76 02 00 00       	callq  401338 <strings_not_equal>
  4010c2:	85 c0                	test   %eax,%eax
  4010c4:	74 13                	je     4010d9 <phase_5+0x77>  //work out
  4010c6:	e8 6f 03 00 00       	callq  40143a <explode_bomb>
  4010cb:	0f 1f 44 00 00       	nopl   0x0(%rax,%rax,1)
  4010d0:	eb 07                	jmp    4010d9 <phase_5+0x77>

```

## 3.gdb bomb

x/s 0x40245e得到flyers

也就是part2可以等价于

```c
if(0x10(%rsp!)=="flyers")
    work_out();
else
 	explore_bomb();
```

## 4.接下来我们专心part1，这部分最难理解的是movzbl 和 %cl，我们稍后讲解

```assembly
  40108b:	0f b6 0c 03          	movzbl (%rbx,%rax,1),%ecx
  40108f:	88 0c 24             	mov    %cl,(%rsp)
  401092:	48 8b 14 24          	mov    (%rsp),%rdx
  401096:	83 e2 0f             	and    $0xf,%edx
  401099:	0f b6 92 b0 24 40 00 	movzbl 0x4024b0(%rdx),%edx    // maduiersnfotvby
  4010a0:	88 54 04 10          	mov    %dl,0x10(%rsp,%rax,1)
  4010a4:	48 83 c0 01          	add    $0x1,%rax
  4010a8:	48 83 f8 06          	cmp    $0x6,%rax
  4010ac:	75 dd                	jne    40108b <phase_5+0x29>
```

## 5.从最后的add    $0x1,%rax 以及 cmp    $0x6,%rax能看出每次%rax加1到6退出，这恰好等于我们的字符

推测出这是一个for循环用来遍历每个字符

所以写成c-like风格代码为

```c
for(int rax=1;rax<=6;rax++)
{
	  movzbl (%rbx,%rax,1),%ecx
      mov    %cl,(%rsp)
  	  mov    (%rsp),%rdx
 	  and    $0xf,%edx
 	  movzbl 0x4024b0(%rdx),%edx    // maduiersnfotvby
  	  mov    %dl,0x10(%rsp,%rax,1)
}
```

## 6.这里movzbl相当于用了强制类型转换 因为char是4位字节的，int是8位字节的 用mov后要给前面补零

movzb1(%rbx,%rax,1),%ecx = (int)mov(%rbx,%rax,1),%ecx 

等价于 ecx = rbx + rax*1

等价于ecx = rbx[rax]



继续美化代码

```c
for(int rax=1;rax<=6;rax++)
{
      ecx = rbx[rax];
      rsp = cl
      rdx = rsp
      edx &= 0xf
      edx = 0x4024b0[rdx]
      0x10rsp[rax] = dl
}
```

其中

rbx = ïnput
0x4024b0 = "maduiersnfotvby";

**`%cl`: `%cl` is an 8-bit register and is part of `%rcx` (the low 8 bits of `%rcx`)**

也就是说cl 和 ecx 是一个东西再加上后面 dl 和 edx 是一个东西 是强制类型转换中的中间产物

## 7.合并ecx和cl

```c
for(int rax=1;rax<=6;rax++)
{
      rdx = (int)rbx[rax];
      edx &= 0xf
      edx = 0x4024b0[rdx]
      0x10rsp[rax] = edx
}
```

最后得到

```c
 char *s = "maduiersnfotvby";
for(int i = 1;i<=6;i++)
{
	  char a = input[i];
	  a &= 0xf;
	  edx = s[a];
	  ans[i] = edx;
}
if(ans == "flyers")
    return;
```

## 8.对应字符查询

也就是说每个字符通过ascii经过强制类型转换后再取最低四位在"maduiersnfotvby"对应的位置就是字母

|目的| f | l | y | e | r |	s	|
|----| ---- | ---- | ---- | ---- | ---- | ---- |
|在s位置(16进制)| 9 | f | e | 5 | 6 | 7 |
|对应字母(多个)| i | o | n | e | f | g |

```c
#include<stdio.h>

int main()
{
	for(int i=97;i<=122;i++)
	{
		char a = (char)i;
		printf("%c = %x\n" , a, (i&0xf));
	}
	return 0;
}
//查看每个字母对应在s位置
```

```
a = 1
b = 2
c = 3
d = 4
e = 5
f = 6
g = 7
h = 8
i = 9
j = a
k = b
l = c
m = d
n = e
o = f
p = 0
q = 1
r = 2
s = 3
t = 4
u = 5
v = 6
w = 7
x = 8
y = 9
z = a
```

# phase5破解成功！

