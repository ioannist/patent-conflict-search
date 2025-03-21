Getting Started
Prerequisites
You need to have the following before you can start using Lens APIs:

Granted access to our API service (request access).
Create an Access Token from your user profile page.
Basic knowledge of API structure and JSON formatting.
Any API Client (cURL, Postman, etc.)
API Resources
As of the current version, Lens offers the following API endpoints:

Patents:

[POST] https://api.lens.org/patent/search
[GET] https://api.lens.org/patent/search
[GET] https://api.lens.org/patent/{lens_id}
Patent Data Schema:

[GET] https://api.lens.org/schema/patent
Scholarly Works:

[POST] https://api.lens.org/scholarly/search
[GET] https://api.lens.org/scholarly/search
[GET] https://api.lens.org/scholarly/{lens_id}
Scholarly Works Data Schema:

[GET] https://api.lens.org/schema/scholarly
Collections:

[POST] https://api.lens.org/collections/{collection_id}
[GET] https://api.lens.org/collections/{collection_id}
You can access scholarly works in your collections from your Work Area. The {collection_id} can be found at the end of your collection URL, e.g. https://www.lens.org/lens/scholar/search/results?collectionId={collection_id}. Here is an example to illustrate how to access your collection.

API usage:

[GET] https://api.lens.org/subscriptions/patent_api/usage
[GET] https://api.lens.org/subscriptions/scholarly_api/usage
Swagger Documentation is available here: https://api.lens.org/swagger-ui.html

API Access
Your use of the API is subject to the Lens Terms of Use. Lens uses token-based API authentication, you can request access and manage your access plan and tokens from your Lens user profile.

For POST Requests, you need to provide your access token in the Request Header when accessing the APIs:

Example: Authorization: Bearer your-access-token

For GET Requests, you can provide your access token in the request parameter:

Example: https://api.lens.org/scholarly/search?token=your-access-token

Rate Limiting
To ensure our public API endpoints remain usable by everyone and to maintain the server’s optimal availability, a rate limiting mechanism is being used to temporarily block any clients that reduce the server’s performance. The applied rate limits will be included in the following HTTP response headers:

x-rate-limit-remaining-request-per-minute: Number of remaining requests allowed in a minute
x-rate-limit-retry-after-seconds: Time in seconds until next request can be performed
x-rate-limit-reset-date: Rate limit will get reset at this date
x-rate-limit-remaining-request-per-month: Number of API calls allowed till the reset date above
x-rate-limit-remaining-record-per-month: Number of remaining records that can be fetched
Once you go over any rate limit you will receive a 429 - Too many requests error with respective messages.

HTTP Responses
Response	Description
200 - Ok	Valid response from the server
400 - Bad Request	Malformed request or incorrect fields/values provided
401 - Unauthorized	Authentication credentials might be incorrect or missing
404 - Not Found	Incorrect Resource URL / Empty Result for supplied queries / Expired scroll_id
415 - Unsupported Media Type	Request body is not json or Content Type is not application/json
429 - Too Many Requests	You have exceeded the number of allowed calls
50x - Internal Server Error	An error occurred on API server side.


---

Patent Request
Request Structure
The request fields are used in queries and sort operations. The request payload should comply with following json schema.

Fields	Description	Required
query	Valid json search request	true
sort	Use available fields to sort results by ascending/descending order.	false
include	Only get specific fields from API response. By default all fields are selected.	false
exclude	Get all fields except undesired ones in search result.	false
size	Integer value to specify number of items per page	false
from	Integer value, defines the offset from the first result	false
scroll_id	Pagination parameter	false (true for next scroll requests)
scroll	Lifespan of Scroll scroll context in minute (e.g. 1m)	false (true for scroll context)
stemming	Change the ability to reduce the search word into root form	false (true by default)
language	For multi-lingual fulltext search	false (EN by default)
regex	For Query String based queries containing regular expressions	false (false by default)
group_by	For group by patent family queries. Supports group by SIMPLE_FAMILY and EXTENDED_FAMILY	false
expand_by	For expand by patent family queries. Supports expand by SIMPLE_FAMILY and EXTENDED_FAMILY	false
min_score	For limiting the response to the most relevant results, e.g. "min_score": 14	false
Searchable Fields
For searching, the following fields are supported by the API:

Group	Field	Type	Description
General	lens_id	String	Unique lens identifier. Every document in the Lens has a unique 15-digit identifier called a Lens ID. e.g. 186-488-232-022-055
General	created	Date	Earliest create date of the patent meta record
General	Ids	Document Identifiers	Use this field to search for patent records using publication identifiers or Lens Ids. e.g. "EP_0227762_B1_19900411", "EP 0227762 B1", "EP_0227762_B1", "EP0227762B1", "EP0227762", "145-564-229-856-440", "US 7,654,321 B2", "7,654,321", "US 2021/0191781 A1"
General	doc_number	String	The document number assigned to a patent application on publication. e.g. 20130227762
General	docdb_id	Integer	The DOCDB identifier for the patent document. e.g. 499168393
General	jurisdiction	String	The jurisidiction of the patent document. e.g. US
General	kind	String	The patent document kind code (varies by jurisdiction). e.g. A1
General	lang	String	The original language of the patent document. e.g. EN
General	date_published	Date	Date of publication for the patent document. e.g. 2009-05-22
General	date_published_sort	Date	Date of publication used for sorting. Note, this field has been converted to a complete date where only partial date information is available for a scholarly work and may not accurately represent the actual publication date. e.g. 2009-05-01
General	year_published	Integer	The year of publication for the patent document. e.g. 2009
General	publication_type	String	Type of patent document. e.g. ABSTRACT, AMBIGUOUS, AMENDED_APPLICATION, AMENDED_PATENT, DESIGN_RIGHT, GRANTED_PATENT, LIMITED_PATENT, PATENT_APPLICATION, PATENT_OF_ADDITION, PLANT_PATENT, SEARCH_REPORT, SPC, STATUTORY_INVENTION_REGISTRATION, UNKNOWN
General	earliest_priority_claim_date	Date	Earliest priority date. The earliest date of filing of a patent application, anywhere in the world, to protect an invention. The priority date may be earlier than the actual filing date of an application if an application claims priority to an earlier parent application, then its earliest priority date may be the same as the parent.
Application	application_reference.jurisdiction	String	The jurisdiction of the application. e.g. US
Application	application_reference.date	Date	The application filing date is the date when a patent application is first filed at a patent office. e.g. 2009-05-22
Application	application_reference.doc_number	String	The document number of the application. e.g. 201715824814
Application	application_reference.kind	String	The kind code of the application. e.g. A1
Priority	priority_claim.jurisdiction	String	The jurisdiction of the priority document. e.g. DE
Priority	priority_claim.date	Date	The publication date of the priority document. e.g. 2009-05-22
Priority	priority_claim.doc_number	String	The document number of the priority document. e.g. 1117265
Priority	priority_claim.kind	String	The kind code of the priority document. e.g. A1
Text Fields	title	String	Title of the patent. e.g. Fidget Spinner
Text Fields	abstract	String	Searches the patent document abstract text. e.g. A processor implements conditional vector operations in which an input vector containing multiple operands to be used in conditional operations is divided into two or more output…
Text Fields	claim	String	Searches the Claims recorded in the patent. e.g. What is claimed is: 1. A method of performing a conditional vector output operation in a processor, the method comprising: receiving electrical signals representative of an input data vector…
Text Fields	description	String	The description text of the patent document. e.g. This invention was made in conjuction with U.S. Government support under U.S. Army Grant No. DABT63-96-C-0037.” BACKGROUND OF THE INVENTION 1. Field of the Invention The present invention is directed to…
Text Fields	full_text	String	The full text of the patent document.
Families	family.extended.member.document_id.jurisdiction	String	The jurisdiction of the extended family member. e.g. CN
Families	family.extended.member.document_id.date	Date	The publication date of the extended family member. e.g. 2009-05-22
Families	family.extended.member.document_id.doc_number	String	The document number of the extended family member. e.g. 1117265
Families	family.extended.member.document_id.kind	String	The kind code of the extended family member. e.g. B2
Families	family.extended.member.lens_id	String	The Lens Id of the extended family member. e.g. 106-213-498-661-220
Families	family.extended.size	Integer	The number of extended family member documents. e.g. 12
Families	family.simple.member.document_id.jurisdiction	String	The jurisdiction of the simple family member. e.g. EP
Families	family.simple.member.document_id.date	Date	The publication date of the simple family member. e.g. 2009-05-22
Families	family.simple.member.document_id.doc_number	String	The document number of the simple family member. e.g. 1117265
Families	family.simple.member.document_id.kind	String	The kind code of the simple family member. e.g. B2
Families	family.simple.member.lens_id	String	The Lens Id of the simple family member. e.g. 106-213-498-661-220
Families	family.simple.size	Integer	The number of simple family member documents. e.g. 5
Applicants	applicant.address	String	The applicant address as recorded on the patent. e.g. TORONTO, ONTARIA, CA
Applicants	applicant.name	String	The patent applicant(s) name. e.g. CPS Technology Holdings LLC
Applicants	applicant.name.exact	String	The patent applicant(s) name. N.B. Use this field for exact name matches. e.g. CPS TECHNOLOGY HOLDINGS LLC
Applicants	applicant.residence	String	The country of the applicant (ISO 2-digit country code). e.g. CA
Applicants	applicant_count	Integer	The number of applicants. e.g. 2
Inventors	inventor.address	String	The address of the inventor. e.g. TORONTO, ONTARIA, CA
Inventors	inventor.name	String	The patent inventor(s) name. e.g. Engebretson Steven P
Inventors	inventor.name.exact	String	The patent inventor(s) name. N.B. Use this field for exact name matches. e.g. ENGEBRETSON STEVEN P
Inventors	inventor.residence	String	The country of residence of the inventor (ISO 2-digit country code). e.g. DE
Inventors	inventor.orcid	String	The inventor’s ORCID identifier e.g. 0000-0001-5352-4498
Inventors	inventor_count	Integer	The number of inventors. e.g. 3
Owners	owner_all.address	String	The owner address as recorded on the patent or legal event. e.g. TORONTO, ONTARIA, CA
Owners	owner_all.country	String	The owner’s country code (ISO 2-digit country code). e.g. US
Owners	owner_all.execution_date	Date	The date of execution of ownership / assignment. e.g. 2009-05-22
Owners	owner_all.name	String	The patent owner(s) name. e.g. CPS Technology Holdings LLC
Owners	owner_all.name.exact	String	The patent owner(s) name. N.B. Use this field for exact name matches. e.g. CPS Technology Holdings LLC
Owners	owner_all.recorded_date	Date	The ownership / assignment event record date. e.g. 2009-05-22
Owners	owner_all_count	Integer	The count of all owners of the patent. N.B. Includes current and former owners. e.g. 5
Examiners	examiner.name	String	The patent examiner name. e.g. Jack W Keith
Examiners	examiner.name.exact	String	The patent examiner name. N.B. Use this field for exact name matches.
Examiners	examiner.department	String	The patent examiner department. e.g. 3646
Examiners	primary_examiner.name	String	The primary patent examiner name. e.g. Jack W Keith
Examiners	primary_examiner.name.exact	String	The primary patent examiner name. N.B. Use this field for exact name matches.
Examiners	primary_examiner.department	String	The primary patent examiner department. e.g. 3646
Examiners	assistant_examiner.name	String	The assistant patent examiner name. e.g. Lily C Garner
Examiners	assistant_examiner.name	String	The assistant patent examiner name. N.B. Use this field for exact name matches.
Citations	cited_by.patent.document_id.jurisdiction	String	The jurisdiction of the citing patent. e.g. EP
Citations	cited_by.patent.document_id.doc_number	String	The document number of the citing patent. e.g. EP2020/063503
Citations	cited_by.patent.document_id.kind	String	The kind code of the citing patent. e.g. B2
Citations	cited_by.patent.lens_id	String	The Lens Id of the citing patent. e.g. 008-840-176-449-446
Citations	cited_by.patent_count	Integer	The count of citing patents (Cited by patent count). e.g. 10
Citations	reference_cited.npl.external_id	String	The resolved external identifier(s) for cited non-patent literature (DOI, PubMed ID, PubMed Central ID or Microsoft Aacademic ID). e.g. 10.1038/nature03090, 12345678919
Citations	reference_cited.npl.lens_id	String	The Lens Id of the resolved non-patent literature citations (i.e. scholarly work Lens Id). e.g. 168-663-423-050-326
Citations	reference_cited.npl.text	String	The original unresolved non-patent literature citation text. e.g. Cormen et al., 'Introduction to Algorithms (MIT Electrical Engineering and Computer Science Series,' MIT Press, ISBN 0262031418, pp. 665-667, 695-697.
Citations	reference_cited.npl.cited_phase	String	The application phase that a non-patent literature citation was added to a patent document. Citation phase values include SEA, ISR, SUP, PRS, APP, EXA, OPP, APL, FOP and TPO. e.g. EXA
Citations	reference_cited.npl.category	String	Cited non-patent literature are identified by letter(s) indicating the category of the cited document. Citation category letters include X, I, Y, A, O, P, T, E, D, L and R. e.g. X
Citations	reference_cited.npl_count	Integer	The number of original non-patent literature citations. e.g. 2
Citations	reference_cited.npl_resolved_count	Integer	The number of resolved scholalry works cited by a patent. e.g. 12
Citations	reference_cited.patent.lens_id	String	The Lens Id of the cited patent. e.g. 106-213-498-661-220
Citations	reference_cited.patent.category	String	Cited patent documents are identified by letter(s) indicating the category of the cited document. e.g. X
Citations	reference_cited.patent.cited_phase	String	The application phase that a cited patent was added to a patent document. e.g. SEA
Citations	reference_cited.patent.document_id.jurisdiction	String	The jurisdiction of the cited patent. e.g. US
Citations	reference_cited.patent.document_id.date	Date	The publication date of the cited patent. e.g. 2009-05-22
Citations	reference_cited.patent.document_id.doc_number	String	The document number of the cited patent. e.g. 4590964
Citations	reference_cited.patent.document_id.kind	String	The kind code of the cited patent. e.g. A
Citations	reference_cited.patent_count	Integer	Number of patents documents cited by a given patent. e.g. 21
Legal Events	legal_status.application_expiry_date	Date	The expiry date of the patent application because of withdrawal or abandonment. e.g. 2009-05-22
Legal Events	legal_status.anticipated_term_date	Date	The anticipated termination date for granted patents. The anticipated termination date is calculated based on the natural term date plus any extensions. e.g. 2009-05-22
Legal Events	legal_status.discontinuation_date	Date	The discontinuation date of the patent due to “unnatural death” (i.e. lapse, withdrawn, abandoned). N.B. The patent can be revived within a certain time frame. e.g. 2009-05-22
Legal Events	legal_status.grant_date	Date	The date the patent application was granted (i.e. the application first grant date). e.g. 2009-05-22
Legal Events	legal_status.granted	Boolean	Indicates if the patent application has been granted in one or more jurisdictions. e.g. TRUE
Legal Events	legal_status.has_disclaimer	Boolean	Indicates if this US patent subjected to a terminal disclaimer. e.g. TRUE
Legal Events	legal_status.has_grant_event	Boolean	Indicates if the patent application/simple family has one or more Grant events in INPADOC. e.g. TRUE
Legal Events	legal_status.has_entry_into_national_phase	Boolean	Indicates if the patent application/simple family has entered the National Phase in INPADOC. e.g. TRUE
Legal Events	legal_status.patent_status	String	The calculated legal status of the patent application. e.g. expired, inactive, active, patented, discontinued, withdrawn or rejected, pending, unknown
Legal Events	legal_status.has_spc	Boolean	Indicates if the patent has a supplementary protection certificate. e.g. TRUE
Legal Events	legal_status.term_extension_days	Integer	Indicates number of days the patent has US Term Extended
Agents & Attorneys	agent.address	String	The agent/attorney address as recorded on the patent. e.g. 20 Red Lion Street, GB-London WC1R 4PJ(GB)
Agents & Attorneys	agent.country	String	The country of the agent/attorney (ISO 2-digit country code). e.g. GB
Agents & Attorneys	agent.name	String	The agent/attorney name. e.g. Chapman, Paul William et al.
Agents & Attorneys	agent.name.exact	String	The patent agent/attorney name. N.B. Use this field for exact name matches. e.g. Paul Chapman
Agents & Attorneys	agent_count	Integer	The number of agents/attorneys listed on the patent. e.g. 1
Classifications	class_cpc.symbol	String	CPC patent classification codes. e.g. H01R11/01
Classifications	class_cpc.first_symbol	String	First CPC classifiction code. e.g. A61K9/0051
Classifications	class_cpc.later_symbol	String	Later CPC classifiction codes. e.g. A61L31/143
Classifications	class_cpc.inv_symbol	String	CPC classification codes identified as invention information. e.g. A61K9/0051
Classifications	class_cpc.add_symbol	String	CPC classification codes identified as additional information. e.g. A61F9/00781
Classifications	class_ipcr.symbol	String	IPCR patent classification codes. e.g. H01R13/115
Classifications	class_ipcr.first_symbol	String	First IPCR classifiction code. e.g. G06F17/30
Classifications	class_ipcr.later_symbol	String	Later IPCR classifiction codes. e.g. A61P35/00
Classifications	class_ipcr.inv_symbol	String	IPCR classification codes identified as invention information. e.g. A61K38/00
Classifications	class_ipcr.add_symbol	String	IPCR classification codes identified as additional information. e.g. F21Y115/10
Classifications	class_national.symbol	String	US patent classification codes. e.g. 439/535
Sequences	sequence.count	Integer	The number of biological sequences associated with a patent. e.g. 5
Sequences	sequence.data_source	String	The data source of the disclosed sequence. DDBJPAT: DDBJ patent division, EMBLPAT_EBI: EMBL-EBI patent division, USPTO_FULLTEXT_RB: USPTO full-text, EP_SEQL: EPO, GBPAT_NCBI: GenBank patent division, WIPO_SEQL: WIPO, GBPAT_EBI, CIPO_BSL: CIPO, GBPAT_DDBJ, USPTO_FULLTEXT_GB, USPTO_PSIPS, DE_MEGA, EP_MEGA
Sequences	sequence.document_location	String	The patent document section of the disclosed sequence(s): DDESC: detailed description, CLAIM: claims, BSUMM: summary, BDRAW: drawings, WDESC: full-text
Sequences	sequence.length_bucket	String	Preset sequence length range (nucleotide: 0-100, 101-5000, 5001-100k, >100k; amino acids: 0-50, 51-300, >300). e.g. NT_101-5000 or AA_301
Sequences	sequence.organism.tax_id	String	The NCBI taxonomic identifier of the organism which the biological sequence is from. e.g. 9616
Sequences	sequence.type	String	The type of sequence e.g. N - nucleotide (including DNA and RNA sub-types), P - peptides/proteins
Sequences	sequence.organism.name	String	Organism name e.g. Homo sapiens
Sequences	sequence.organism.name.exact	String	Use this field for exact name matches e.g. Homo sapiens
Citations	reference_cited.npl_resolved_count	Integer	The number of resolved scholalry works cited by a patent. e.g. 12
Filtering
You can use the following pre-defined filters to refine your search results:

Field	Description	Possible Value
cited_by_patent	Indicates if a patent is cited by other patents.	true/false
cites_npl	Indicates if a patent has cited any non-patent literature in the references.	true/false
cites_patent	Indicates if a patent cites other patents.	true/false
cites_resolved_npl	Indicates if a patent document cites non-patent literature that have been resolved to a matching Lens Scholarly Work.	true/false
has_abstract	Indicates if the abstract is available for the patent document.	true/false
has_agent	Indicates if the patent record has agent/attorney information.	true/false
has_applicant	Indicates if the patent record has applicant information.	true/false
has_claim	Indicates if the claims are available for the patent document.	true/false
has_description	Indicates if the description is available for the patent document.	true/false
has_full_text	Indicates if the full text from the PTO is available for the patent document.	true/false
has_owner	Indicates if the patent record has owner information.	true/false
has_examiner	Indicates if the patent record has examiner information.	true/false
has_inventor	Indicates if the patent record has inevntor information.	true/false
has_sequence	Indicates if the patent record has sequence information.	true/false
has_title	Indicates if the title is available for the patent document.	true/false
has_docdb	Indicates if the DOCDB information is available for the patent document.	true/false
has_inpadoc	Indicates if the patent document has associated legal events in INPADOC.	true/false
Example:

{
  "query": {
     "match":{
     	  "has_full_text": true
     }
  }
}
Pagination
Lens API provides two type of pagination based on their use:

Offset/Size Based Pagination
Use parameter from to define the offset and size to specify number of records expected. This is useful when you want to skip some records and select desired ones. Example below skips first 100 and select 50 records after that.

{
  "query": "nanotechnology",
  "from": 100,
  "size":50
}
Similarly for GET requests, the following parameters are applicable: size=50&from=100

Note:

Offset/size based paginations is suitable for small result sets only and does not work on result sets of more that 10,000 records. For larger volume data downloads, use Cursor Based Pagination.
Cursor Based Pagination
You can specify records per page using size (default 20 and max 100-500, refer to your API plan for your max records per request) and context alive time scroll (default 1 minute). You will receive a scroll_id in response, which should be passed via request body to access next set of results. Since the scroll_id tends to change every time after each successful requests, please use the most recent scroll_id to access next page. This is not suited for real time user requests.

{
  "scroll_id": "MjAxOTEw;DnF1ZXJ...R2NZdw==",
  "scroll": "1m"
}
Note:

The lifespan of scroll_id is limited to 1 minute for the current API version. Using expired scroll_id will result bad request HTTP response.
Parameter size will be used for first scroll query and will remain the same for whole scroll context. Hence, using size in each scroll request will not have any effect.
Cursor based pagination is only applicable to POST requests.
For optimal performance, we recommend limiting the number of items (e.g. lens_ids) in a single terms query to 10,000.
If no further results found, the response will be 204 and scroll context gets invalidated. The subsequent response will be 400, if same scroll_id is used again.
Sorting
Result can be retrieved in ascending or descending order. Use the following format and fields to apply sorting to the API response. Results can also be sorted by relevance score using relevance.

{
  "sort": [
      {"reference_cited.patent_count":"desc"},
      {"year_published": "asc"},
      {"relevance": "desc"}
  ]
}
For GET requests, the following structure is applicable: sort=desc(reference_cited.patent_count),asc(date_published),desc(relevance)

Projection
You can control the output fields in the API Response using projection. There are two possible ways to do that.

include: Only request specific fields from the API endpoint
exclude: Fields to be excluded from result
 {"include":["lens_id", "title","description","claim"]}
 {"exclude":["legal_status","biblio.classifications_cpc"]}
For GET requests following structure is applicable. include=lens_id,title,description,claim

Note: Both include and exclude can be used in same request.

Stemming
Stemming allows to reduce the words to root form. E.g. Constructed and constructing will be stemmed to root construct. Since sometime the default stemming might not give you exact result, disabling it will just search for provided form of the word. e.g. "stemming": false

Language
Available search language codes include:

AR = Arabic
DE = Dutch
EN = English
ES = Spanish
FR = French
JA = Japanese
KO = Korean
PT = Portugese
RU = Russian
ZH = Chinese
Regex
Regex allows the use of regular expressions in Query String based query, e.g. "regex": true

{
    "query": "field_of_study:/.*[Ee]conom.*/",
    "regex": true
}
Group by Family
Group by patent family queries supports group by SIMPLE_FAMILY and EXTENDED_FAMILY, e.g. "group_by": "SIMPLE_FAMILY". This returns the top sorted patent document record for each family (sorted by relevance by default).

Expand by Family
Expand by patent family queries supports group by SIMPLE_FAMILY and EXTENDED_FAMILY, e.g. "expand_by": "SIMPLE_FAMILY". This returns all the patent family members from the patent documents that match your query.

Note:

Group by family does not work with scroll requests.
Minimum Score
The minimum score represents the relevance score based on the query matching score used in Elasticsearch. This can be used to limit the response to the most relevant results and can be used in 2-steps:

Perform an initial API request to get the max_score. N.B. the size of the request needs to be greater than 0 to return the max_score.
You can then filter by the min_score in subsequent requests.
For example, if the max_score is 14.9 and there are 236K results in total from the initial request, you can pass the min_score as 14 (i.e. less than max_score) in the subsequent request to limit the response to the most relevant results only.

Note:

The max_score will be returned as 0 if size is 0 or if a sort is applied.
Passing the min_score as x% of max_score may not result in top x% results.
The score is calculated for each query by Elasticsearch, and so the max_score value will be different for each query.
The max_score will be returned as 0 if sorting by any fields other than relevance, i.e. {"relevance": "desc"}.
Supported Query Types
Following queries are supported by current version of Lens API:

Note: The Lens API query requests use a modified form of the Elasticsearch Query DSL. For more details on the Elasticsearch query syntax, we recommend reading this guide on the query syntax: Elasticsearch Query DSL

Term Query
Term Query operates in a single term and search for exact term in the field provided.

Example: Find record by publication type

{
    "query": {
        "term": {
            "publication_type": "GRANTED_PATENT"
        }
    }
}
Terms Query
Terms Query allows you to search multiple exact terms for a provided field. A useful scenario is while searching multiple identifiers.

Example: Search for multiple document numbers

{
	"query": {
		"terms": {
			"doc_number": ["20130227762", "1117265"]
		}
	}
}
Note:

Avoid using the Term and Terms queries for text fields. To search text field values, we recommend using the Match and Match Phrase queries instead.
Match query
Match query accepts text/numbers/dates. The main use case of the match query is full-text search. It matches each words separately. If you need to search whole phrase use match phrase query.

Example: Get patents filed by IBM

{
  "query": {
      	"match":{
      		"applicant.name": "IBM"
      	}
   }
}
Match Phrase query
Match phrase query accepts text/numbers/dates. The main use case for the match query is for full-text search.

Example: Get patents filed by IBM

{
  "query": {
      	"match_phrase":{
      		"applicant.name": "IBM"
      	}
   }
}
Note: Both Match and Match Phrase are used for text searching but the difference is how they do it. For example, searching for "Cleveland, OH" differs between Match and Match Phrase like this:

Match: standard search in which each word is matched separately (for example: Cleveland OR OH)
Match Phrase: matches the exact phrase provided. In this case it will match the exact text Cleveland, OH
Range query
Range query query to match records within the provided range.

Example: Get patents published between years 1980 and 2000

{
  "query": {
      	"range": {
            "year_published": {
                "gte": "1980",
                "lte": "2000"
            }
        }
   }
}
Example: Filter documents which has Patent Term Extension

{
  "query": {
      	"range": {
            "legal_status.term_extension_days": {
                "gt": 0
            }
        }
   }
}
Boolean query
Bool Query allows to combine multiple queries to create complex query providing precise result. It can be created using one or more of these clauses: must, should, must_not and filter. You can use must for AND operation and should for OR.

Example: Search for granted patents from inventors named “Engebretson” that have been cited by other patents.

{
    "query": {
        "bool": {
            "must": [
                {
                    "match": {
                        "cited_by_patent": "true"
                    }
                },
                {
                    "match": {
                        "publication_type": "GRANTED_PATENT"
                    }
                },
                {
                    "match": {
                        "inventor.name": "Engebretson"
                    }
                }
            ]
        }
    }
}
Query String Based Query
Query different terms with explicit operators AND/OR/NOT to create a compact query string.

Example: Find patents with javascript in the title that have been filed by IBM and published between 2000 and 2018.

{"query": "(title:javascript AND applicant.name:(IBM)) AND year_published:[2000 TO 2018]"}
If you need to use any reserved special characters, you should escape them with leading backslash.

Example: Searching by CPC code using string based query

{"query": "class_cpc.symbol:Y02E10\\/70"}
You can use json based format for string based query and mixed with complex boolean queries like this:

{
    "query": {
        "bool": {
            "must": [
                {
                    "query_string": {
                        "query": "crispr-cas9",
                        "fields": [
                            "title",
                            "claims",
                            "description"
                        ],
                        "default_operator": "or"
                    }
                }
            ],
            "filter": [
                {
                    "term": {
                        "has_owner": true
                    }
                }
            ]
        }
    }
}

---

Patent Response
Response Fields
Field	Type	Description	Example
lens_id	String	Unique lens identifier. Every document in the Lens has a unique 15-digit identifier called a Lens ID.	186-488-232-022-055
jurisdiction	String	The jurisidiction of the patent document.	US
doc_number	String	The document number assigned to a patent application on publication.	20130227762
kind	String	The patent document kind code (varies by jurisdiction).	A1
date_published	Date	Date of publication for the patent document.	2009-05-22
doc_key	String	The unique document key for the patent document.	EP_0227762_B1_19900411
docdb_id	Long	The DOCDB identifier for the patent document.	499168393
publication_type	String (Document Types)	Type of patent document.	 
lang	String (Language)	The original language of the patent document.	EN
biblio	Bibliographic Data	 	 
families	Families	 	 
abstract	List of Abstract	The patent document abstract text.	 
claims	List of Claims	The Claims recorded in the patent document.	 
description	Description	The description text of the patent document.	 
legal_status	Legal Status Information	The legal Status Information for the patent document.	 
sequence_listing	Sequence Listing	Information on the sequences listed on the patent document.	 
Bibliographic Data
Field	Type	Description
publication_reference	Document Id	The publication reference document Id.
application_reference	Document Id	The application reference document Id.
priority_claims	Priority Claims	The priotrity claims documents.
invention_title	List of Title	Title of the patent / invention.
parties	Parties	The parties associated with the patent (applicants, inventors, owners, agents, etc.)
classifications_cpc	CPC Classifications	CPC Classifications
classifications_ipcr	IPCR Classifications	IPCR Classifications
classifications_national	US Classifications	US Classifications
references_cited	References Cited	The references cited in the patent document (patents and non-patent literature (NPL) ).
cited_by	Cited By	The patents citing the patent document.
Families
Field	Type	Description
simple_family	Simple Family	Simple patent family (based on DOCDB simple patent family).
extended_family	Extended Family	Extended patent family (based on INPADOC extended patent family).
Simple Family
Field	Type	Description	Example
members	List of Simple Family Members	List of simple family members.	 
size	Integer	The number of simple family member documents.	12
Simple Family Members
Field	Type	Description	Example
document_id	Document Id	Simple family member document Id.	 
lens_id	String (LensId)	Simple family member Lens Id.	186-488-232-022-055
Extended Family
Field	Type	Description	Example
members	List of Extended Family Members	List of extended family members.	 
size	Integer	The number of extended family member documents.	18
Extended Family Members
Field	Type	Description	Example
document_id	Document Id	Extended family member document Id.	 
lens_id	String (LensId)	Extended family member Lens Id.	186-488-232-022-055
Abstract
Field	Type	Description	Example
text	String	The patent document abstract text.	A processor implements conditional vector operations in which an input vector containing multiple operands to be used in conditional operations is divided into two or more output…
lang	String (Language)	The language of the patent document abstract text.	EN
Claims
Field	Type	Description	Example
claims	List of Claims Text	The list of Claims recorded in the patent document.	 
lang	String (Language)	The language of the patent document claims.	EN
Claims Text
Field	Type	Description	Example
claim_text	List of String	The Claim text recorded in the patent document.	What is claimed is: 1. A method of performing a conditional vector output operation in a processor, the method comprising: receiving electrical signals representative of an input data vector…
Description
Field	Type	Description	Example
text	String	The description text of the patent document.	This invention was made in conjuction with U.S. Government support under U.S. Army Grant No. DABT63-96-C-0037.” BACKGROUND OF THE INVENTION 1. Field of the Invention The present invention is directed to…
lang	String (Language)	The language of the patent document description.	EN
Legal Status Information
Field	Type	Description	Example
granted	Boolean	Indicates if the patent application has been granted in one or more jurisdictions.	TRUE
grant_date	Date	The date the patent application was granted (i.e. the application first grant date).	2009-05-22
application_expiry_date	Date	The expiry date of the patent application because of withdrawal or abandonment.	2009-05-22
anticipated_term_date	Date	The anticipated termination date for granted patents. The anticipated termination date is calculated based on the natural term date plus any extensions.	2009-05-22
discontinuation_date	Date	The discontinuation date of the patent due to “unnatural death” (i.e. lapse, withdrawn, abandoned). N.B. The patent can be revived within a certain time frame.	2009-05-22
has_disclaimer	Boolean	Indicates if this US patent subjected to a terminal disclaimer.	TRUE
patent_status	String (Patent Status)	The calculated legal status of the patent application.	ACTIVE
has_spc	Boolean	Indicates if the patent has a supplementary protection certificate.	TRUE
calculation_log	List of String	The legal status calculation log.	[Application Filing Date: 2001-11-21, Earliest Filing Date: 2001-11-21 priority to EP01984746A, Granted date: 2009-07-29]
N.B. Legal status information is derived from INPADOC and USPTO Assignments data and may not be accurate. For more details, please see Patent Legal Status Calculations

Sequence Listing
Field	Type	Description	Example
sequence_types	List of String	The type of sequences listed on the patent document. e.g. N - nucleotide (including DNA and RNA sub-types), P - peptides/proteins.	N, RNA, DNA, P
length_buckets	String	Preset sequence length ranges (nucleotide: “0-100”, “101-5000”, “5001-100k”, “>100k”; Peptide: “0-50”, “51-300”, “>300”).	NT_1_100, NT_101_5000, NT_5001_100000, NT_100001, AA_1_50, AA_51_300, AA_301
organisms	List of Organisms	List of declared organisms associated with the sequences listed on the patent document.	 
count	Integer	The number of sequences listed on the patent document.	31
Organisms
Field	Type	Description	Example
tax_id	Integer	The NCBI taxonomic identifier of the declared organism.	9606, 12110
name	String	The name of the declared organism.	Homo sapiens, Foot-and-mouth disease virus
Priority Claims
Field	Type	Description
claims	List of Priority Claims Documents	List of priority claims documents
earliest_claim	Earliest Priority Claim	Earliest priority claim
Priority Claims Documents
Field	Type	Description	Example
jurisdiction	String (Jurisdiction)	The jurisdiction of the priority document.	DE
doc_number	String	The document number of the priority document.	1117265
kind	String	The kind code of the priority document.	A1
date	LocalDate	The publication date of the priority document.	2009-05-22
sequence	Integer	The sequence of the Prioroty Claim Document	3
Earliest Priority Claim
Field	Type	Description	Example
date	Date	Earliest priority date. The earliest date of filing of a patent application, anywhere in the world, to protect an invention. The priority date may be earlier than the actual filing date of an application if an application claims priority to an earlier parent application, then its earliest priority date may be the same as the parent.	2009-05-22
Title
Field	Type	Description	Example
text	String	Title of the patent / invention.	Fidget Spinner
lang	String (Language)	The language of the patent / invention title.	EN
Parties
Field	Type	Description
inventors	List of Inventors	List of inventors associated with the patent.
applicants	List of Applicants	List of applicants associated with the patent.
owners_all	List of Owners	List of owners associated with the patent.
agents	List of Agents and Attorneys	List of agents and attorneys associated with the patent.
examiners	List of Examiners	List of examiners
Inventors
Field	Type	Description	Example
residence	String	The country of residence of the inventor (ISO 2-digit country code).	DE
sequence	Integer	The sequence of the inventor listed on the patent document.	3
orcid	String	The inventor’s ORCID identifier.	0000-0002-7168-5006
extracted_name	Name	The patent inventor’s name.	Engebretson Steven P
extracted_address	String	The address of the inventor.	TORONTO, ONTARIA, CA
Applicants
Field	Type	Description	Example
residence	String	The country of the applicant (ISO 2-digit country code).	CA
sequence	Integer	The sequence of the applicant listed on the patent document.	2
extracted_name	Name	The patent applicant’s name.	IBM
extracted_address	String	The applicant address as recorded on the patent.	SEATTLE, WASHINGTON, US
Owners
Field	Type	Description	Example
recorded_date	Date	The ownership / assignment event record date.	2009-05-22
execution_date	Date	The date of execution of ownership / assignment.	2009-05-22
extracted_name	Name	The patent owner name.	CPS Technology Holdings LLC
extracted_address	String	The owner address as recorded on the patent or legal event.	TORONTO, ONTARIA, CA
extracted_country	String	The owner’s country code (ISO 2-digit country code).	US
Agents and Attorneys
Field	Type	Description	Example
sequence	Integer	The sequence of the agent/attorney as listed on the patent document.	1
extracted_name	Name	The agent/attorney name.	Chapman, Paul William et al.
extracted_address	String	The agent/attorney address as recorded on the patent.	20 Red Lion Street, GB-London WC1R 4PJ(GB)
extracted_country	String	The country of the agent/attorney (ISO 2-digit country code).	GB
Examiners
Field	Type	Description	Example
primary_examiner.extracted_name	Name	The Primary examiner’s name.	Terapane; John F.
primary_examiner.department	String	Primary Examiner’s department.	2844
assistant_examiner.extracted_name	Name	The Assistant examiner’s name.	Wolffe; Susan
Name
Field	Type	Description	Example
value	String	The party name.	Chapman, Paul William et al., CPS Technology Holdings LLC, Chapman, Paul William et al.
CPC Classifications
Field	Type	Description	Example
classifications	List of Classification Symbols	List of CPC classification symbols and their attributes.	H01R11/01
IPCR Classifications
Field	Type	Description	Example
classifications	List of Classification Symbols	List of IPCR classification symbols and their attributes.	H01R13/115
US Classifications
Field	Type	Description	Example
classifications	List of Classification Symbols	List of US classification symbols and their attributes.	439/535
Classification Symbols
Field	Type	Description	Example
symbol	String	Classification code symbol.	H01R11/01, H01R13/115, 439/535
classification_value	String	Classification value. Applies to CPC and IPRC Classifications only. See Classification Value enums.	I, L
classification_symbol_position	String	Classification symbol position. Applies to CPC and IPRC Classifications only. See Classification Symbol Position enums.	F, A
References Cited
Field	Type	Description	Example
citations	List of Citations	List of patent and NPL references cited.	 
npl_resolved_count	Integer	The number of resolved scholalry works cited by a patent.	12
npl_count	Integer	The number of scholalry works cited by a patent.	2
patent_count	Integer	The number of patents cited by a patent.	2
Note: Citations can be duplicated because they appear in different phases of the patenting process.

Citations
Field	Type	Description	Example
patcit	Patents Cited	Patents cited in the patent documnet.	 
nplcit	NPL Cited	Non-patent literature cited in the patent document.	 
sequence	Integer	The sequence of the citation in the patent document.	5
category	Array	Cited patent document are identified by letter(s) indicating the category of the cited document, see Citation Category enums.	X
cited_phase	String	The phase of the patenting process when the citation was added, see Cited Phase enums.	SEA
Patents Cited
Field	Type	Description	Example
document_id	Array of Document Id	The cited patent document Ids.	 
lens_id	String (LensId)	The cited patent document Lens Id.	118-962-823-688-691
NPL Cited
Field	Type	Description	Example
text	String	The original non-patent literature citation text in the patent document.	Cormen et al., 'Introduction to Algorithms (MIT Electrical Engineering and Computer Science Series,' MIT Press, ISBN 0262031418, pp. 665-667, 695-697.
lens_id	String (LensId)	The Lens Id of the resolved non-patent literature citations (i.e. scholarly work Lens Id).	168-663-423-050-326
external_ids	List of String	List of external identifiers for non-patent literature citation (DOI, PubMed ID, PubMed Central ID or Microsoft Aacademic ID).	[10.1038/nature03090; 12345678919]
Cited By
Field	Type	Description
patents	List of Cited By Patents	List of patents citing the patent documnet.
Cited By Patents
Field	Type	Description	Example
document_id	Document Id	The citing patent document Id.	 
lens_id	String (LensId)	The citing patent Lens Id.	118-962-823-688-691
Document Id
Field	Type	Description	Example
jurisdiction	String (Jurisdiction)	The jurisidiction of the patent document.	US
doc_number	String	The document number assigned to a patent application on publication.	20130227762
kind	String	The patent document kind code (varies by jurisdiction).	A1
date	LocalDate	Date of publication for the patent document, or filing date for the application reference. N.B. date information for Cited By Patents is not always available.	2009-05-22
Enums
Document Types
ABSTRACT, AMBIGUOUS, AMENDED_APPLICATION, AMENDED_PATENT, DESIGN_RIGHT, GRANTED_PATENT, LIMITED_PATENT, PATENT_APPLICATION, PATENT_OF_ADDITION, PLANT_PATENT, SEARCH_REPORT, SPC, STATUTORY_INVENTION_REGISTRATION, UNKNOWN

Jurisidction
Jurisidction codes: US, EP, WO, DE, CN, JP, GB, etc.

Language
Language codes: EN, FR, DE, CN etc.

Patent Status
ACTIVE - Granted patent is in force
PENDING - Application is pending
DISCONTINUED - Application discontinued, withdrawn or rejected, i.e. discontinuation before grant
INACTIVE - Granted patent not in force because of lapse, non-fee payment, etc. The patent hasn’t reached the term date and can be revived
EXPIRED - Patent has reached the term date and is no longer in force
PATENTED - PCT applications that have been granted in one or more designated states, or non-PCT granted patents without enough information to calculate the term date
UNKNOWN - Not enough information to calculate status
Cited Phase
SEA - Originates from the Search report, date search report completed
ISR - Originates from International Search Report, date international search report completed
SUP - Originates from Supplementary Search Report, date supplementary search report completed
PRS - Origin Pre-Grant/Pre-Search national, date search report completed
APP - Cited by the Applicant, date information available in EPO systems
EXA - Revealed during the Examination phase (citing document is kind-code ‘A’), date information available in EPO systems
OPP - Revealed during the Opposition phase, date opposition letters filed
APL - Filed for appeal by applicant / proprietor / patentee, date appeal filed
FOP - Filed for opposition by any third party, date observation letters filed
TPO - Third party observation, date observation letters filed
CH2 - Chapter 2, date international search report completed
Citation Category
X: Particularly relevant if taken alone.
I: Particularly relevant if taken alone - prejudicing inventive step.
Y: Particularly relevant if combined with another document of the same category.
A: Defining the state of the art and not prejudicing novelty or inventive step.
O: Non-written disclosure.
P: Intermediate document.
T: Theory or principle underlying the invention.
E: Earlier patent application, but published after the filing date of the application searched (potentially conflicting patent documents).
D: Document cited in the application.
L: Document cited for other reasons.
R: Referring to a patent application or a utility model filed on the same day that relates to the same invention
Classification Value
I - Invention
L - Later
Classification Symbol Position
F - First
A - Additional
Sample Patent Record
Request:

{
  "query":{
  	"match":{"lens_id":"031-156-664-516-153"}
  }
}
Response:

{
    "total": 1,
    "max_score": 16.750214,
    "data": [
        {
            "lens_id": "031-156-664-516-153",
            "jurisdiction": "EP",
            "doc_number": "2471949",
            "kind": "A1",
            "date_published": "2012-07-04",
            "doc_key": "EP_2471949_A1_20120704",
            "docdb_id": 364714255,
            "lang": "en",
            "biblio": {
                "publication_reference": {
                    "jurisdiction": "EP",
                    "doc_number": "2471949",
                    "kind": "A1",
                    "date": "2012-07-04"
                },
                "application_reference": {
                    "jurisdiction": "EP",
                    "doc_number": "10197481",
                    "kind": "A",
                    "date": "2010-12-31"
                },
                "priority_claims": {
                    "claims": [
                        {
                            "jurisdiction": "EP",
                            "doc_number": "10197481",
                            "kind": "A",
                            "date": "2010-12-31",
                            "sequence": 1
                        }
                    ],
                    "earliest_claim": {
                        "date": "2010-12-31"
                    }
                },
                "invention_title": [
                    {
                        "text": "Verfahren zur Identifizierung durch Molekulartechniken von genetischen Varianten, die kein D-Antigen (D-) und das veränderte C-Antigen (C+W) codieren",
                        "lang": "de"
                    },
                    {
                        "text": "Method for the identification by molecular techniques of genetic variants that encode no D antigen (D-) and altered C antigen (C+W)",
                        "lang": "en"
                    },
                    {
                        "text": "Procédé pour l'identification par des techniques moléculaires de variantes génétiques ne codant pas d'antigène D (D-) et qui codent l'antigène C modifié (C+W)",
                        "lang": "fr"
                    }
                ],
                "parties": {
                    "applicants": [
                        {
                            "residence": "ES",
                            "extracted_name": {
                                "value": "PROGENIKA BIOPHARMA SA"
                            }
                        }
                    ],
                    "inventors": [
                        {
                            "residence": "ES",
                            "sequence": 1,
                            "extracted_name": {
                                "value": "OCHOA JORGE"
                            }
                        },
                        {
                            "residence": "ES",
                            "sequence": 2,
                            "extracted_name": {
                                "value": "LOPEZ MONICA"
                            }
                        },
                        {
                            "residence": "ES",
                            "sequence": 3,
                            "extracted_name": {
                                "value": "TEJEDOR DIEGO"
                            }
                        },
                        {
                            "residence": "ES",
                            "sequence": 4,
                            "extracted_name": {
                                "value": "MARTINEZ ANTONIO"
                            }
                        },
                        {
                            "residence": "ES",
                            "sequence": 5,
                            "extracted_name": {
                                "value": "SIMON LAUREANO"
                            }
                        }
                    ],
                    "agents": [
                        {
                            "extracted_name": {
                                "value": "Casley, Christopher Stuart"
                            },
                            "extracted_address": "Mewburn Ellis LLP \n33 Gutter Lane, London\nEC2V 8AS",
                            "extracted_country": "GB"
                        }
                    ],
                    "owners_all": [
                        {
                            "recorded_date": "2013-12-11",
                            "execution_date": "2013-12-11",
                            "extracted_name": {
                                "value": "PROGENIKA BIOPHARMA, S.A."
                            }
                        }
                    ]
                },
                "classifications_ipcr": {
                    "classifications": [
                        {
                            "symbol": "C12Q1/68",
                            "classification_value": "I",
                            "classification_symbol_position": "F"
                        }
                    ]
                },
                "classifications_cpc": {
                    "classifications": [
                        {
                            "symbol": "A61K35/14",
                            "classification_value": "I",
                            "classification_symbol_position": "L"
                        },
                        {
                            "symbol": "C12Q1/6881",
                            "classification_value": "I",
                            "classification_symbol_position": "F"
                        },
                        {
                            "symbol": "C12Q1/6881",
                            "classification_value": "I",
                            "classification_symbol_position": "F"
                        },
                        {
                            "symbol": "C12Q2600/156",
                            "classification_value": "A",
                            "classification_symbol_position": "L"
                        },
                        {
                            "symbol": "C12Q2600/156",
                            "classification_value": "A",
                            "classification_symbol_position": "L"
                        }
                    ]
                },
                "references_cited": {
                    "citations": [
                        {
                            "sequence": 1,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2006075254",
                                    "kind": "A2",
                                    "date": "2006-07-20"
                                },
                                "lens_id": "185-701-234-511-622"
                            },
                            "category": [
                                "X"
                            ],
                            "cited_phase": "SEA"
                        },
                        {
                            "sequence": 2,
                            "nplcit": {
                                "text": "AVENT N D ET AL: \"The bloodgen project of the European Union, 2003-2009\", TRANSFUSION MEDICINE AND HEMOTHERAPY 2009 S. KARGER AG CHE LNKD- DOI:10.1159/000218192, vol. 36, no. 3, June 2009 (2009-06-01), pages 162 - 167, XP002633276, ISSN: 1660-3796",
                                "lens_id": "004-047-148-411-345",
                                "external_ids": [
                                    "10.1159/000218192",
                                    "pmc2980524",
                                    "21113258"
                                ]
                            },
                            "category": [
                                "I"
                            ],
                            "cited_phase": "SEA"
                        },
                        {
                            "sequence": 3,
                            "nplcit": {
                                "text": "WESTHOFF CONNIE M ET AL: \"DIIIa and DIII Type 5 are encoded by the same allele and are associated with altered RHCE*ce alleles: clinical implications\", TRANSFUSION (MALDEN), vol. 50, no. 6, June 2010 (2010-06-01), pages 1303 - 1311, XP002633277, ISSN: 0041-1132",
                                "lens_id": "125-529-168-227-632",
                                "external_ids": [
                                    "10.1111/j.1537-2995.2009.02573.x",
                                    "pmc2908519",
                                    "20088832"
                                ]
                            },
                            "category": [
                                "X",
                                "D",
                                "I"
                            ],
                            "cited_phase": "SEA"
                        },
                        {
                            "sequence": 4,
                            "nplcit": {
                                "text": "PHAM BACH-NGA ET AL: \"Heterogeneous molecular background of the weak C, VS+, hr(B)-, Hr(B)- phenotype in black persons\", TRANSFUSION (MALDEN), vol. 49, no. 3, March 2009 (2009-03-01), pages 495 - 504, XP002633278, ISSN: 0041-1132",
                                "lens_id": "086-240-354-498-516",
                                "external_ids": [
                                    "10.1111/j.1537-2995.2008.02005.x",
                                    "19040491"
                                ]
                            },
                            "category": [
                                "X",
                                "D",
                                "I"
                            ],
                            "cited_phase": "SEA"
                        },
                        {
                            "sequence": 5,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2006032897",
                                    "kind": "A2",
                                    "date": "2006-03-30"
                                },
                                "lens_id": "071-147-450-571-460"
                            },
                            "category": [
                                "Y"
                            ],
                            "cited_phase": "SEA"
                        },
                        {
                            "sequence": 6,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "DE",
                                    "doc_number": "10049363",
                                    "kind": "A1",
                                    "date": "2001-10-31"
                                },
                                "lens_id": "033-566-032-105-609"
                            },
                            "category": [
                                "Y"
                            ],
                            "cited_phase": "SEA"
                        },
                        {
                            "sequence": 7,
                            "nplcit": {
                                "text": "FAAS B H W ET AL: \"Rh E/e genotyping by allele-specific primer amplification\", BLOOD, AMERICAN SOCIETY OF HEMATOLOGY, US, vol. 85, no. 3, 1 January 1995 (1995-01-01), pages 829 - 832, XP002614101, ISSN: 0006-4971",
                                "lens_id": "017-174-583-162-658",
                                "external_ids": [
                                    "7833484",
                                    "10.1182/blood.v85.3.829.bloodjournal853829"
                                ]
                            },
                            "category": [
                                "Y"
                            ],
                            "cited_phase": "SEA"
                        },
                        {
                            "sequence": 8,
                            "nplcit": {
                                "text": "MAASKANT-VAN WIJK P A ET AL: \"GENOTYPING OR RHD BY MULTIPLEX POLYMERASE CHAIN REACTIONS ANALYSIS OF SIX RHD-SPECIFIC EXONS\", TRANSFUSION, AMERICAN ASSOCIATION OF BLOOD BANKS, BETHESDA, MD, US, vol. 11, no. 38, 1 November 1998 (1998-11-01), pages 1015 - 1021, XP008005129, ISSN: 0041-1132, DOI: 10.1046/J.1537-2995.1998.38111299056309.X",
                                "lens_id": "059-652-196-800-856",
                                "external_ids": [
                                    "10.1046/j.1537-2995.1998.38111299056309.x",
                                    "9838930"
                                ]
                            },
                            "category": [
                                "Y"
                            ],
                            "cited_phase": "SEA"
                        },
                        {
                            "sequence": 9,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2011003921",
                                    "kind": "A2",
                                    "date": "2011-01-13"
                                },
                                "lens_id": "187-498-666-224-100"
                            },
                            "category": [
                                "E"
                            ],
                            "cited_phase": "SEA"
                        },
                        {
                            "sequence": 1,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2009000084",
                                    "kind": "A1",
                                    "date": "2008-12-31"
                                },
                                "lens_id": "096-184-763-479-702"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 2,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2010000210",
                                    "kind": "A1",
                                    "date": "2010-01-07"
                                },
                                "lens_id": "082-610-612-867-442"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 3,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2010000380",
                                    "kind": "A1",
                                    "date": "2010-01-07"
                                },
                                "lens_id": "080-193-167-878-372"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 4,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2010000635",
                                    "kind": "A1",
                                    "date": "2010-01-07"
                                },
                                "lens_id": "160-241-370-254-307"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 5,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2010000972",
                                    "kind": "A1",
                                    "date": "2010-01-07"
                                },
                                "lens_id": "189-848-800-128-321"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 6,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2010002366",
                                    "kind": "A1",
                                    "date": "2010-01-07"
                                },
                                "lens_id": "091-724-438-661-108"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 7,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2010002367",
                                    "kind": "A1",
                                    "date": "2010-01-07"
                                },
                                "lens_id": "180-004-304-457-874"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 8,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2010003113",
                                    "kind": "A1",
                                    "date": "2010-01-07"
                                },
                                "lens_id": "014-308-334-256-321"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 9,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2010003649",
                                    "kind": "A1",
                                    "date": "2010-01-14"
                                },
                                "lens_id": "149-519-969-815-807"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 10,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2010003664",
                                    "kind": "A1",
                                    "date": "2010-01-14"
                                },
                                "lens_id": "134-590-889-498-511"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 11,
                            "patcit": {
                                "document_id": {
                                    "jurisdiction": "WO",
                                    "doc_number": "2010003809",
                                    "kind": "A2",
                                    "date": "2010-01-14"
                                },
                                "lens_id": "087-699-367-879-444"
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 12,
                            "nplcit": {
                                "text": "M. E. REID; C. LOMAS-FRANCIS: \"The Blood Group Antigen FactsBook\", 2004, ELSEVIER LTD."
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 13,
                            "nplcit": {
                                "text": "CONNIE M.; WESTHOFF, SUNITHA VEGE; CHRISTINE HALTER-HIPSKY; TRINA WHORLEY; KIM HUE-ROYE; CHRISTINE LOMAS-FRANCIS; MARION E.: \"Dllla and Dill Type 5 are encoded by the same allele and are associated with altered RHCE*ce alleles: clinical implications\", REID. TRANSFUSION, vol. 50, 2010, pages 1303 - 1311",
                                "lens_id": "125-529-168-227-632",
                                "external_ids": [
                                    "10.1111/j.1537-2995.2009.02573.x",
                                    "pmc2908519",
                                    "20088832"
                                ]
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 14,
                            "nplcit": {
                                "text": "BACH-NGA PHAM; THIERRY PEYRARD; GENEVIEVE JUSZCZAK; ISABELLE DUBEAUX; DOMINIQUE GIEN; ANTOINE BLANCHER; JEAN-PIERRE CARTRON; PHILI: \"Heterogeneous molecular background of the weak C, VS+, hrB-, HrB- phenotype in black persons\", TRANSFUSION, vol. 49, 2009, pages 495 - 504",
                                "lens_id": "086-240-354-498-516",
                                "external_ids": [
                                    "10.1111/j.1537-2995.2008.02005.x",
                                    "19040491"
                                ]
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 15,
                            "nplcit": {
                                "text": "MARTINE G.H.M.; TAX, C.; ELLEN VAN DER SCHOOT; RENE' VAN DOORN; LOTTE DOUGLAS-BERGER; DICK J.; VAN RHENEN; PETRA A.; MAASKANT-VAN: \"RHC and RHc genotyping in different ethnic groups\", TRANSFUSION, vol. 42, 2002, pages 6234 - 644",
                                "lens_id": "028-957-496-647-171",
                                "external_ids": [
                                    "12084173",
                                    "10.1046/j.1537-2995.2002.00096.x"
                                ]
                            },
                            "cited_phase": "APP"
                        },
                        {
                            "sequence": 16,
                            "nplcit": {
                                "text": "M. E. REID; C. LOMAS-FRANCIS.: \"The Blood group antigen FactsBook\", 2004, ELSEVIER LTD."
                            },
                            "cited_phase": "APP"
                        }
                    ],
                    "patent_count": 15,
                    "npl_count": 10,
                    "npl_resolved_count": 8
                },
                "cited_by": {
                    "patents": [
                        {
                            "document_id": {
                                "jurisdiction": "WO",
                                "doc_number": "2014135331",
                                "kind": "A1"
                            },
                            "lens_id": "089-849-576-069-505"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "US",
                                "doc_number": "9359643",
                                "kind": "B2"
                            },
                            "lens_id": "007-584-344-944-889"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "US",
                                "doc_number": "9637788",
                                "kind": "B2"
                            },
                            "lens_id": "138-800-291-931-331"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "US",
                                "doc_number": "10253366",
                                "kind": "B2"
                            },
                            "lens_id": "172-445-088-115-557"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "WO",
                                "doc_number": "2012171990",
                                "kind": "A1"
                            },
                            "lens_id": "084-623-881-707-629"
                        }
                    ],
                    "patent_count": 5
                }
            },
            "families": {
                "simple_family": {
                    "members": [
                        {
                            "document_id": {
                                "jurisdiction": "EP",
                                "doc_number": "2471949",
                                "kind": "B1",
                                "date": "2013-12-25"
                            },
                            "lens_id": "033-643-087-926-128"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "EP",
                                "doc_number": "2471949",
                                "kind": "A1",
                                "date": "2012-07-04"
                            },
                            "lens_id": "031-156-664-516-153"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "US",
                                "doc_number": "20120172239",
                                "kind": "A1",
                                "date": "2012-07-05"
                            },
                            "lens_id": "095-621-040-202-546"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "ES",
                                "doc_number": "2445709",
                                "kind": "T3",
                                "date": "2014-03-04"
                            },
                            "lens_id": "192-287-095-019-170"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "US",
                                "doc_number": "20160060696",
                                "kind": "A1",
                                "date": "2016-03-03"
                            },
                            "lens_id": "126-336-041-308-107"
                        }
                    ],
                    "size": 5
                },
                "extended_family": {
                    "members": [
                        {
                            "document_id": {
                                "jurisdiction": "EP",
                                "doc_number": "2471949",
                                "kind": "B1",
                                "date": "2013-12-25"
                            },
                            "lens_id": "033-643-087-926-128"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "EP",
                                "doc_number": "2471949",
                                "kind": "A1",
                                "date": "2012-07-04"
                            },
                            "lens_id": "031-156-664-516-153"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "ES",
                                "doc_number": "2445709",
                                "kind": "T3",
                                "date": "2014-03-04"
                            },
                            "lens_id": "192-287-095-019-170"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "US",
                                "doc_number": "20120172239",
                                "kind": "A1",
                                "date": "2012-07-05"
                            },
                            "lens_id": "095-621-040-202-546"
                        },
                        {
                            "document_id": {
                                "jurisdiction": "US",
                                "doc_number": "20160060696",
                                "kind": "A1",
                                "date": "2016-03-03"
                            },
                            "lens_id": "126-336-041-308-107"
                        }
                    ],
                    "size": 5
                }
            },
            "sequence_listing": {
                "sequence_types": [
                    "N",
                    "DNA"
                ],
                "length_buckets": [
                    "NT_5001_100000",
                    "NT_101_5000",
                    "NT_1_100"
                ],
                "organisms": [
                    {
                        "tax_id": 9606,
                        "name": "Homo sapiens"
                    },
                    {
                        "tax_id": -1,
                        "name": "Unknown/Artificial"
                    }
                ],
                "count": 42
            },
            "legal_status": {
                "granted": true,
                "grant_date": "2013-12-25",
                "anticipated_term_date": "2030-12-31",
                "calculation_log": [
                    "Application Filing Date: 2010-12-31",
                    "Granted Date: 2013-12-25",
                    "Anticipated Termination Date: 2030-12-31"
                ],
                "patent_status": "ACTIVE"
            },
            "abstract": [
                {
                    "text": "The invention relates to the field of genotyping and blood cell antigen determination. In particular, the invention adresses the problem of discriminating the  RHD*DIIIa-CE(4-7)-D  or  RHD*DIIIa-CE(4-7)-D )-like blood type variants, which express the C +w  antigen and lack a D antigen, from  RHD*DIIIa ,  RHD*DIVa-2  and other blood type variants. The invention provides methods for genotyping a subject, comprising: \na) determining at least 4 markers in a sample that has been obtained from the subject, wherein the markers comprise: \n(i) the presence or absence of an RHCE*C allele; \n(ii) the presence or absence of an RHD/RHCE hybrid exon 3 (RHD/CE Hex03) allele; \n(iii) the absence of, or a single nucleotide polymorphism (SNP) variant within, of any one of the SNPs at position 602 of RHD exon 4, position 667 of RHD exon 5, or position 819 of RHD exon 6; and \n(iv) the absence of, or SNP variant within, of the SNP at position 1048 of RHD exon 7. The invention also provides products, in particular, probes, primers and kits for use in such methods.",
                    "lang": "en"
                }
            ],
            "claims": [
                {
                    "claims": [
                        {
                            "claim_text": [
                                "A method of genotyping a subject, the method comprising:\n determining at least 4 markers in a sample that has been obtained from the subject, wherein the markers comprise:\n (i) the presence or absence of an RHCE*C allele; \n (ii) the presence or absence of an RHD/RHCE hybrid exon 3 (RHD/CE Hex03) allele; \n (iii) the absence of, or a single nucleotide polymorphism (SNP) variant within, any one of RHD exon 4,  RHD  exon 5, or  RHD  exon 6; and \n (iv) the absence of, or SNP variant within, RHD exon 7."
                            ]
                        },
                        {
                            "claim_text": [
                                "A method according to claim 1, wherein:\n a) the SNP variant within  RHD  exon 4 is at position 602 of the  RHD  coding sequence (rs1053355), the SNP variant within  RHD  exon 5 is at position 667 of the  RHD  coding sequence (rs1053356), the SNP variant within  RHD  exon 6 is at position 819 of the  RHD  coding sequence; and/or \n b) the SNP variant within  RHD  exon 7 is at position 1048 of the  RHD  coding sequence (rs41307826)."
                            ]
                        },
                        {
                            "claim_text": [
                                "A method according to claim 1 or 2, wherein the markers further comprise:\n (v) the presence or absence of an RHD exon 3 allele."
                            ]
                        },
                        {
                            "claim_text": [
                                "A method according to any one of the preceding claims, wherein:\n a) the method further comprises determining the RHD and RHC antigen phenotypes of the subject; and/or \n b) the method comprises detecting the presence or absence of a blood type variant selected from:  RHD*DIIIa ;  RHD*DIVa-2;  or  RHD*DIIIa-CE(4-7)-D  or  RHD*DIIIa-CE(4-7)-D )-like blood type variants, e.g. wherein the method comprises detecting the presence or absence of  RHD*DIIIa-CE(4-7)-D  or  RHD*DIIIa-CE(4-7)-D )-like blood type variants; and/or \n c) marker (iii) is the SNP within RHD exon 4 at position 602 of the RHD coding sequence (rs1053355); and/or \n d) the RHCE*C allele is determined by determining the presence or absence of RHCE*C intron 2, or any one of the following positions in the RHCE coding sequence: position 307 (exon 2), position 48 (exon 1), position 150 (exon 2), position 178 (exon 2), position 201 (exon 2) and/or position 203 (exon 2)."
                            ]
                        },
                        {
                            "claim_text": [
                                "A method according to any one of the preceding claims, wherein the sample comprises nucleic acid and the method comprises amplifying the nucleic acid or a portion thereof by PCR using primers, e.g. wherein:\n a) the PCR primers for determining the RHCE*C allele are a forward PCR primer specific for RHCE*C, and a non-specific reverse PCR primer, e.g. wherein\n (i) the non-specific reverse primer is shared with RHD, RHC*C and/or RHC*c; and/or \n (ii) the PCR primers comprise:\n Forward: 5'-GGCCACCACCATTTGAA-3' (SEQ ID NO: 3) \n Reverse: 5'-CCATGAACATGCCACTTCAC-3', (SEQ ID NO: 4) \nor a variant thereof having up to 4 nucleotide alterations; and/or \n b) the PCR primers for determining the RHD/CE Hex03 allele are forward and reverse PCR primers targeting sequences located in introns 2 and 3, or introns 3 and 2, respectively, e.g. wherein\n (i) the PCR primers comprise:\n Forward primer: 5'-TCCTGGCTCTCCCTCTCT-3' (SEQ ID NO: 9) \n Reverse primer: 5'-TTTTCAAAACCCCGGAAG-3 (SEQ ID NO: 10) \nor a variant thereof having up to 4 nucleotide alterations; and/or \n c) the PCR primers for determining the SNP within RHD exon 4 at position 602 of the RHD coding sequence (rs1053355) are forward and reverse primers targeting sequences located in introns 3 and 4, or introns 4 and 3, respectively, e.g. wherein\n (i) the PCR primers comprise:\n Forward primer: 5'-GCTCTGAACTTTCTCCAAGGACT-3' (SEQ ID NO: 17) \n Reverse primer: 5'-ATTCTGCTCAGCCCAAGTAG-3' (SEQ ID NO: 18) or a variant thereof having up to 4 nucleotide alterations; and/or \n d) the PCR primers for determining the SNP within RHD exon 5 at position 667 of the  RHD  coding sequence (rs1053356) are forward and reverse primers targeting sequences located in introns 4 and 5, or introns 5 and 4, respectively, e.g. wherein\n (i) the PCR primers comprise:\n Forward primer: 5'-TTGAATTAAGCACTTCACAGAGCA-3' (SEQ ID NO: 19) \n Reverse primer: 5'-CACCTTGCTGATCTTCCC-3' (SEQ ID NO: 20) or a variant thereof having up to 4 nucleotide alterations; and/or \n e) the PCR primers for determining the SNP within RHD exon 6 at position 819 of the  RHD  coding sequence are forward and reverse primers targeting sequences located in introns 5 and 6, or introns 6 and 5, respectively, e.g. wherein\n (i) the PCR primers comprise:\n Forward primer: 5'-AGTAGTGAGCTGGCCCATCA-3' (SEQ ID NO: 21) \n Reverse primer: 5'-CTTCAGCCAAAGCAGAGGAG-3' (SEQ ID NO: 22) \nor a variant thereof having up to 4 nucleotide alterations; and/or \n f) the PCR primers for determining the SNP within RHD exon 7 at position 1048 of the  RHD  coding sequence (rs41307826) are forward and reverse primers targeting sequences located in introns 6 and 7, or introns 7 and 6, respectively, e.g. wherein\n (i) the PCR primers comprise:\n Forward primer: 5'-ACAAACTCCCCGATGATGTGAGTG-3' (SEQ ID NO: 35) \n Reverse primer: 5'-GAGGCTGAGAAAGGTTAAGCCA-3' (SEQ ID NO: 36) \nor a variant thereof having up to 4 nucleotide alterations; and/or \n g) as dependent from claim 3, the PCR primers for determining the RHD exon 3 allele are forward and reverse primers targeting sequences located in introns 2 and 3, or introns 3 and 2, respectively, e.g. wherein\n (i) the PCR primers comprise:\n Forward primer: 5'-TCCTGGCTCTCCCTCTCT-3' (SEQ ID NO: 15) \n Reverse primer: 5'-GTTGTCTTTATTTTTCAAAACCCT-3' (SEQ ID NO: 16) \nor a variant thereof having up to 4 nucleotide alterations."
                            ]
                        },
                        {
                            "claim_text": [
                                "A method according to claim 5, wherein the amplified nucleic acid comprises a label, e.g. wherein\n a) the label comprises a biotinylated nucleotide; and/or \n b) the label comprises a fluorescent moiety."
                            ]
                        },
                        {
                            "claim_text": [
                                "A method according to any one of the preceding claims, wherein the sample comprises nucleic acid, and the method comprises amplifying the nucleic acid or a portion thereof by PCR using primers, fragmenting the amplified nucleic acid, and labelling the fragmented nucleic acid with biotinylated ddNTPS using a terminal deoxynucleotidyl transferase (TdT) enzyme."
                            ]
                        },
                        {
                            "claim_text": [
                                "A method according to any one of the preceding claims, wherein determining the presence, absence or SNP variant of a marker comprises contacting nucleic acid containing each marker with one or more probes, e.g. wherein:\n a) as dependent from claim 3, the probes for determining the presence or absence of RHD/CE Hex03 or RHD exon 3 contact an SNP located in both RHD/CE Hex03 and RHD exon 3, wherein one SNP variant is specific for RHD/CE Hex03, and another SNP variant is specific for RHD exon 3, e.g. wherein\n (i) the SNP is at position 410 of the coding sequence, located within both RHD/CE Hex03 and RHD exon 3; and/or \n (ii) the probes comprise:\n (1) 5'-TTTTACAGACGCCTGCTACCATG-3', (SEQ ID NO: 5) \n (2) 5'-CATGGTAGCAGGCGTCTGTAAAA-3', (SEQ ID NO: 6) \n (3) 5'-TTTTACAGACGTCTGCTACCATG-3', (SEQ ID NO: 7) and \n (4) 5'-CATGGTAGCAGACGTCTGTAAAA-3', (SEQ ID NO: 8) \nor a variant of any one of probes 1 to 4 having up to 4 nucleotide alterations; and/or \n b) the probes for determining the absence or SNP variant of the SNP at: position 602 of the  RHD  coding sequence located within exon 4 (rs1053355), position 667 of the  RHD  coding sequence located within exon 5 (rs1053356), or position 819 of the  RHD  coding sequence located within exon 6 comprise:\n (i) RHD exon 4:\n (1) 5'-ATAAAGATCAGACAGCAACGATACC-3' (SEQ ID NO: 23) \n (2) 5'-TAAAGATCAGACAGCAACGATAC-3' (SEQ ID NO: 24) \n (3) 5'-ATAAAGATCAGAGAGCAACGATACC-3' (SEQ ID NO: 25) \n (4) 5'-TAAAGATCAGAGAGCAACGATAC-3' (SEQ ID NO: 26) \nor a variant of any one of probes 1 to 4 having up to 4 nucleotide alterations; \n (ii) RHD exon 5:\n (1) 5'-CTGGCCAAGTTTCAACTCTGC-3' (SEQ ID NO: 27) \n (2) 5'-TGGCCAAGTTTCAACTCTG-3' (SEQ ID NO: 28) \n (3) 5'-CTGGCCAAGTGTCAACTCTGC-3' (SEQ ID NO: 29) \n (4) 5'-TGGCCAAGTGTCAACTCTG-3' (SEQ ID NO: 30) \nor a variant of any one of probes 1 to 4 having up to 4 nucleotide alterations; \n (iii) RHD exon 6:\n (1) 5'-GTGCACAGTGCGGTGTTGGCAGG-3' (SEQ ID NO: 31) \n (2) 5'- TGCACAGTGCGGTGTTGGCAG -3' (SEQ ID NO: 32) \n (3) 5'- GTGCACAGTGCAGTGTTGGCAGG -3' (SEQ ID NO: 33) \n (4) 5'-TGCACAGTGCAGTGTTGGCAG-3' (SEQ ID NO: 34) \nor a variant of any one of probes 1 to 4 having up to 4 nucleotide alterations. \n c) the probes for determining the SNP variant of the SNP at position 1048 of the  RHD  coding sequence located within exon 7 (rs41307826)comprise:\n (1) 5'-TGCTGGTGCTTGATACCGTCGGA-3' (SEQ ID NO: 37) \n (2) 5'-GCTGGTGCTTGATACCGTCGG-3' (SEQ ID NO: 38) \n (3) 5'-TGCTGGTGCTTCATACCGTCGGA-3' (SEQ ID NO: 39) \n (4) 5'-GCTGGTGCTTCATACCGTCGG-3' (SEQ ID NO: 40) \nor a variant of any one of probes 1 to 4 having up to 4 nucleotide alterations."
                            ]
                        },
                        {
                            "claim_text": [
                                "A method according to claim 8, wherein\n a) one or more of the probes comprise a label, e.g. wherein the label is a fluorescent moiety; and/or \n b) one or more of the probes is attached to a solid support or conjugated to one or more particles.."
                            ]
                        },
                        {
                            "claim_text": [
                                "A set of primers for amplifying nucleic acid comprising at least four of the markers described in claim 1, 2, 3, 4(c), and 4(d), e.g. wherein the set of primers comprises at least three primer pairs selected from the primers set forth in:\n (i) claim 5(a), \n (ii) claim 5(b), \n (iii) any one of claims 5(c), 5(d) or 5(e) \n (iv) claim 5(f), and \n (v) claim 5(g)."
                            ]
                        },
                        {
                            "claim_text": [
                                "A set of primers for amplifying nucleic acid comprising at least three primer pairs selected from the primers set forth in:\n (i) claim 3(a)(ii), \n (ii) claim 3(b)(i), \n (iii) any one of claims 3(c)(i), 3(d)(i) or 3(e)(i), \n (iv) claim 3(f)(i), and \n (v) claim 3(g)(i)."
                            ]
                        },
                        {
                            "claim_text": [
                                "A set of primers for amplifying nucleic acid , wherein at least 50% are the primer pairs described in claim 10 or 11."
                            ]
                        },
                        {
                            "claim_text": [
                                "A set of probes for determining the presence, absence or single nucleotide polymorphism (SNP) variant of at least three of the markers described in claim 1, 2, 3, 2(c) and 2(d), e.g. wherein:\n a) the set of probes comprises the probes described in claims 8(a), 8(b) and 8(c)."
                            ]
                        },
                        {
                            "claim_text": [
                                "A set of probes according to claim 13, wherein:\n a) the probes are immobilised on a solid support or conjugated to one or more particles, e.g. wherein the solid support comprises one or more attached labels, e.g. wherein the label is a fluorochrome; and/or \n b) one or more probes comprise a label, e.g wherein the label is a fluorescent moiety."
                            ]
                        },
                        {
                            "claim_text": [
                                "A kit for genotyping a subject, the kit comprising a set of PCR primers according to any one of claims 10 to 12, and a set of probes according to any one of claims 13 or 14."
                            ]
                        }
                    ],
                    "lang": "en"
                }
            ],
            "description": {
                "text": "Field of the Invention The invention relates to methods for genotyping and blood cell antigen determination, which in particular may discriminate the  RHD*DIIIa-CE(4-7)-D  or  RHD*DIIIa-CE(4-7)-D )-like blood type variants, which express the C +W  antigen and lack a D antigen, from  RHD*DIIIa ,  RHD*DIVa-2  and other blood type variants. The invention also relates to products, in particular...",
                "lang": "en"
            },
            "publication_type": "PATENT_APPLICATION"
        }
    ],
    "results": 1
}

---

Patent Examples
Find the 20 most recently published patent records from offset 10 that match the provided string query
{
    "query": "title:\"X-ray crystallography\"",
    "size": 20,
    "from": 10,
    "sort": [
        {
            "date_published": "desc"
        }
    ]
}
US applications granted after 2018
{
    "query": {
        "bool": {
            "must": [
                {
                    "match" : {
                        "legal_status.granted": true
                    }
                },
                {
                    "term" : {
                        "publication_type": "PATENT_APPLICATION"
                    }
                },
                {
                    "term" : {
                        "jurisdiction": "US"
                    }
                },
                {
                    "range": {
                        "year_published": {
                            "gte": 2018
                        }
                    }
                }
            ]
        }
    }
}
US Granted patents expiring between 2020-10-10 to 2020-10-20
{
    "query": {
        "bool": {
            "must": [
                {
                    "match" : {
                        "legal_status.granted": true
                    }
                },
                {
                    "term" : {
                        "jurisdiction": "US"
                    }
                },
                {
                    "range": {
                        "legal_status.anticipated_term_date": {
                            "gte": "2020-10-10",
                            "lte": "2020-10-20"
                        }
                    }
                }
            ]
        }
    }
}
Chinese patents with CRISPR in the title or abstract or claims published between 2010-09-01 to 2020-09-30
{
    "query": {
        "bool": {
            "must": [
                {
                    "bool": {
                        "should": [
                            {
                                "match" : {
                                    "title": "CRISPR"
                                }
                            },
                            {
                                "match" : {
                                    "abstract": "CRISPR"
                                }
                            },
                            {
                                "match" : {
                                    "claim": "CRISPR"
                                }
                            }
                        ]
                    }
                },
                {
                    "term" : {
                        "jurisdiction": "CN"
                    }
                
                },
                {
                    "range" : {
                        "date_published": {
                            "gte": "2010-09-01",
                            "lte": "2020-09-30"
                        }
                    }
                
                }
            ]
        }
    },
    "size" : 10,
    "include": ["lens_id", "biblio.publication_reference", "biblio.invention_title.text", "abstract.text", "claims.claims.claim_text"]
}
Patent applications from 2012 to 2020 with CRISPR cas9 in the claims
{
    "query": {
        "bool": {
            "must": [
                {
                    "term" : {
                        "publication_type": "PATENT_APPLICATION"
                    }
                
                },
                {
                    "match" :{
                        "claim": "CRISPR cas9"
                    }
                },
                {
                    "range" : {
                        "date_published": {
                            "gte": "2012-01-01",
                            "lte": "2020-09-30"
                        }
                    }
                
                }
            ]
        }
    }
}
US Patents by document number
{
    "query": {
        "bool": {
            "must": [
                {"terms": {"doc_number": ["8625931", "8626565","8626684"]}},
                {"term": {"jurisdiction": "US"}}
            ]
        }
    },
    "size": 10,
    "include": ["lens_id", "biblio.publication_reference", "biblio.invention_title", "abstract", "claims"]
}
Search for document identifiers
{
    "query": {
        "terms": {
            "ids": ["US 8625931", "US_8626565_B2", "EP_0227762_B1_19900411", "EP 0227762 B1", "EP_0227762_B1", "EP0227762B1", "EP0227762", "145-564-229-856-440", "US 7,654,321 B2", "7,654,321", "US 2021/0191781 A1"]
        }
    },
    "size": 10,
    "include": ["lens_id", "biblio.publication_reference", "biblio.invention_title", "abstract", "claims"]
}
Using GET Requests
[GET] https://api.lens.org/patent/search?token=[your-access-token]&size=10&query=YOUR_QUERY&include=biblio,lens_id&sort=desc(date_published)

Example Postman Collection
You can download a Postman Collection containing a variety of useful API example requests here: patent-postman-collection.json

---