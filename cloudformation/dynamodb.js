module.exports = {
    Resources: {
        "LeoStats": {
            "Type": "AWS::DynamoDB::Table",
            "Properties": {
                "AttributeDefinitions": [
                    {
                        "AttributeName": "id",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "bucket",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "period",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "time",
                        "AttributeType": "N"
                    }
                ],
                "KeySchema": [
                    {
                        "AttributeName": "id",
                        "KeyType": "HASH"
                    },
                    {
                        "AttributeName": "bucket",
                        "KeyType": "RANGE"
                    }
                ],
                "BillingMode": "PAY_PER_REQUEST",
                "GlobalSecondaryIndexes": [
                    {
                        "IndexName": "period-time-index",
                        "KeySchema": [
                            {
                                "AttributeName": "period",
                                "KeyType": "HASH"
                            },
                            {
                                "AttributeName": "time",
                                "KeyType": "RANGE"
                            }
                        ],
                        "Projection": {
                            "ProjectionType": "INCLUDE",
                            "NonKeyAttributes": [
                                "current"
                            ]
                        }
                    }
                ],
                "StreamSpecification": {
                    "StreamViewType": "NEW_AND_OLD_IMAGES"
                }
            }
        }
    }
}
