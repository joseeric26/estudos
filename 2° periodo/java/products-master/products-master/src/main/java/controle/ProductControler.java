package controle;

import com.products_api.models.ProductModel;
import com.products_api.services.ProductService;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/produto")
public class ProductControler {
    @Autowired
    private ProductService productService;

    @PostMapping
    public ResponseEntity<ProductModel> save(@RequestBody ProductModel productModel) {
        ProductModel produto = productService.create(productModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(produto);
    }

    @GetMapping
    public ResponseEntity<List<ProductModel>> listProducts() {
        List<ProductModel> produtos = productService.findAll();
        return ResponseEntity.ok().body(produtos);
    }

    @GetMapping("/idProduto")
    public ResponseEntity<ProductModel> getById(@PathVariable UUID idProduct) {
        ProductModel produto = productService.findById(idProduct);
        return ResponseEntity.ok().body(produto);
    }

    @DeleteMapping("/{idProduto}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID idProduct) {
        ProductModel produto = productService.delete(idProduct);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/idProdut")
    public ResponseEntity<ProductModel> updateProduct(@RequestBody ProductModel productModel, @PathVariable UUID idProduct) {
        ProductModel produtoEdited = productService.update(idProduct, productModel);
        return ResponseEntity.ok().body(produtoEdited);
    }
}