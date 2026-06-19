# Ethyne Language Specification

## Introduction

Ethyne is a JavaScript-inspired interpreted programming language.

File extension:

```text
.eth
```

---

# Comments

Single Line Comment

```eth
!! this is a comment
```

Multi Line Comment

```eth
!!!
This is a
multi-line comment
!!!
```

---

# Variables

Variables are declared using the `pet` keyword.

```eth
pet name = "Charan"'
pet age = 20'
```

---

# Data Types

## Number

```eth
pet x = 10'
pet pi = 3.14'
```

## String

```eth
pet msg = "Hello Ethyne"'
```

## Boolean

```eth
pet a = tru'
pet b = nahi'
```

## Null

```eth
pet data = kali'
```

---

# Printing Output

Use `bol`.

```eth
bol("Hello World")'
```

Output:

```text
Hello World
```

---

# Input

Use `adg`.

```eth
adg name "Enter your name:"
bol(name)'
```

---

# Arithmetic Operators

```eth
+
-
*
/
%
```

Example:

```eth
pet a = 10'
pet b = 5'

bol(a + b)'
bol(a - b)'
bol(a * b)'
bol(a / b)'
```

---

# Comparison Operators

```eth
==
!=
<
>
<=
>=
```

Example:

```eth
yen (age >= 18) {
    bol("Adult")'
}
```

---

# Logical Operators

```eth
&&
||
!
```

Example:

```eth
yen (age > 18 && age < 60) {
    bol("Working Age")'
}
```

---

# If Statement

```eth
yen (condition) {
    bol("True")'
}
```

---

# If Else

```eth
yen (age >= 18) {
    bol("Adult")'
}
lek {
    bol("Minor")'
}
```

---

# While Loop

```eth
pet i = 0'

jado (i < 5) {
    bol(i)'
    i = i + 1'
}
```

---

# Functions

```eth
kar greet(name) {
    bol("Hello " + name)'
}
```

Call:

```eth
greet("Charan")'
```

---

# Return Statement

```eth
kar add(a,b) {
    dena a + b'
}

pet result = add(10,20)'
bol(result)'
```

---

# Truthiness Rules

False values:

```eth
kali
nahi
0
""
```

Everything else is considered true.

---

# File Extension

```text
.eth
```

---

# Example Program

```eth
pet name = "Charan"'

kar greet(user) {
    bol("Welcome " + user)'
}

greet(name)'
```
