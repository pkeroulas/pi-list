# Stream compare

## Use cases

* get a sense the evolution of a media accross a production pipeline by comparing 2 streams, e.g. the input and the output of a processing unit
* validate the network redundancy (ST 2022-7)
* measure the inter-essence synchronicity for eventual re-alignement

![comp](./comparision_use_cases.png)

## Media-based analysis

The idea consists in probing and comparing 2 streams reflecting the same content but at 2 different `logical points` of the network, i.e. multicast groups.
This type of inter-stream analysis aims at measuring the *propagation delay through the network path* and determine the *transparency of a processing chain*.
Regarless of the media type, algorithm takes as input 2 decoded and extracted and decoded streams: the `reference`, which is most likely the earliest and the `main` (terminology inspired by ffmpeg).
Since RTP timestamp can be overwritten by any processing equipment, it doesn't provide a reliable measurement reference and *media-content-based* analysis is prefered.

[Video-to-video](./v2v_comparison.md)

[Audio-to-audio](./a2a_comparison.md)

## Redundancy test

[SMPTE ST 2022-7](./ST_2022-7.md)

## Media realignement

TODO
