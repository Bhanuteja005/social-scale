# API

# Service list



Use this method to get service list

Request sample

https://fampage.in/api/v2?action=services&key=yourKey


Response sample

[
  {
    "service": 1,
    "name": "Subscribers",
    "type": "subscribe",
    "category": "Instagram profiles. Adds views and small activity.",
    "rate": "100.00",
    "min": 10,
    "max": 15000,
    "refill": false,
    "cancel": true
  }
]

The method returns an array of objects provided by the following fields:

serviceIntegerIdentity of service

nameStringName

type

String

Type. One of:

like

subscribe

comment

like_to_comment

dislike

dislike_to_comment

repost

friend

vote

retweet

follow

favorite


categoryStringDescription

rateDoublePrice per 1000

minIntegerMinimum order quantity

maxIntegerMaximum order quantity

refillBooleanRefill is available

cancelBooleanCancelling is available

# create
Use this method for creating orders. In case of success it will return id of created

Request sample

https://fampage.in/api/v2?action=add&service=1&link=instagram.com/instagram&quantity=100&key=yourKey


Response sample

{
  "order": 1
}

The method returns an object containing the following fields:

orderIntegerOrder identity

# status

Use this method to get information about order

Request sample

https://fampage.in/api/v2?action=status&order=1&key=yourKey


Response sample

{
  "charge": "0.27819",
  "start_count": "3572",
  "status": "Partial",
  "remains": "157",
  "currency": "USD"
}

The method returns an object containing the following fields:

chargeDoubleSpent money

start_countIntegerCount when order activate

status

String

Order status. One of

In progress

Completed

Awaiting

Canceled

Fail

Partial


remainsIntegerRemains count

currencyStringCurrency

# multiple status

Use this method to get information about orders

Request sample

https://fampage.in/api/v2?action=status&orders=1,2,3&key=yourKey


Response sample

{
  "1": {
    "charge": "0.27819",
    "start_count": "3572",
    "status": "Partial",
    "remains": "157",
    "currency": "USD"
  },
  "2": "Incorrect order ID",
  "3": "Incorrect order ID"
}

The method returns an array of objects provided by the following fields:

chargeDoubleSpent money

start_countIntegerCount when order activate

status

String

Order status. One of:

In progress

Completed

Awaiting

Canceled

Fail

Partial


remainsIntegerRemains count

currencyStringCurrency

# refil

Use this method to create refill

Request sample

https://fampage.in/api/v2?action=refill&order=1&key=yourKey


Response sample

{
  "refill": 1
}

The method returns an object containing the following fields:

refillInteger1

# Balance

Use this method to retrieve user balance

Request sample

https://fampage.in/api/v2?action=balance&key=yourKey


Response sample

{
  "balance": "99.80",
  "currency": "USD"
}

The method returns an object containing the following fields:

balanceStringCurrent balance

currencyStringCurrency

# cancel

Use this method to cancel order

Request sample

https://fampage.in/api/v2?action=cancel&order=1&key=yourKey


Response sample

{
  "ok": "true"
}

The method returns an object containing the following fields:

okBooleanCancellation status true/false