# codegen

```bash
#!/bin/bash
#
npx graph codegen -- ./subgraphs/linear-buildr.yaml

```

# deploy

You need set THEGRAPH_LINEAR_ACCESS_TOKEN first.

```bash
#!/bin/bash

THEGRAPH_LINEAR_ACCESS_TOKEN="xxxxx"

#npx graph auth https://api.thegraph.com/deploy/ $THEGRAPH_LINEAR_ACCESS_TOKEN
npx graph deploy --debug --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ --access-token $THEGRAPH_LINEAR_ACCESS_TOKEN -- ssscott2019/linear subgraphs/linear-buildr.yaml

#npm run deploy:buildr
```

