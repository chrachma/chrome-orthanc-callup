# Orthanc Study Callup in Chrome

## Purpose
When browsing studies in Orthanc default web ui, this extension parses all StudyInstanceUIDs in page and provides links to open ("call up") that studies in a new tab. The url of that tab can be configured in options of this extension.

## Restrictions
* For now the content of the Orthanc web page is simply parsed as is which may not remain valid in future Orthanc versions.
* Make sure not to configure a URL in extension options that would violate data security regulations regarding the DICOM Study Instance UID.

