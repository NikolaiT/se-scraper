var nodeIterator = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_COMMENT,    
    { acceptNode: function(node) { return NodeFilter.FILTER_ACCEPT; } }
);

// Remove all comment nodes
while(nodeIterator.nextNode()){
    var commentNode = nodeIterator.referenceNode;
    commentNode.remove();
}