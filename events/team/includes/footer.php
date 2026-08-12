cat > /home/velzhsrg/public_html/Ph/Events/PR/team/includes/footer.php <<'PHP'
    </main>

    <footer class="team-footer">
        <div class="container-fluid">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                <span>
                    &copy; <?= e((string) date('Y')) ?> Velza Global. All rights reserved.
                </span>

                <span>
                    <?= e(APP_NAME) ?> &middot; Version <?= e(APP_VERSION) ?>
                </span>
            </div>
        </div>
    </footer>

</div>

<script
    src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
    integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
    crossorigin="anonymous"
></script>

</body>
</html>
PHP