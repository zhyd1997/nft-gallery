KUSAMA acc

GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY Polkastat
Cn2LmF7os4b4uxkRVZa3bqmXAYEmXybDbHKXabqy6kKNwwK
DABmvpEuvFssthysEcTePxuLfQHebJQr2F4n31xZCvCFcXe


const { api } = C.getInstance()
api.derive.chain.<press tab>
await api.query.system.events.at('0xacbf31202a89627b57a68e762040fe8829b917fcb64842aaa5452f0e593aa17a')

0x27e7a17305ce99d357bb8f147754c9fdcf701fefc5d09e9cc042e8eaa9b35dc0

---

# Kodadot Test Plan 

### Objective 
- Integrate e2e Tests to validate various functionalities of the NFT Gallery is working as expected. The goal is to ensure buttons,links and Data are able to function properly. 

### Test Cases 

- Features 
    - Hompepage 
        - Header
        - Body 
        - Footer
    - Create
    - Gallery
    - Spotlight
    - About
    - FAQ
    - Grants
    - Login
    - Language

### Gallery
 
 ```feature
Feature: Search Functionality for Viewing Type of Prints 

  Scenario: User inputs Search term in the bar
    Given User is on the /gallery page
    When They enter a search team such as "generative" 
    Then The search results should show NFT based on the term.
```